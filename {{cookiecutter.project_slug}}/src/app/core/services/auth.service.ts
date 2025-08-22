import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, throwError, timer, of } from 'rxjs';
import { map, tap, catchError, switchMap, finalize } from 'rxjs';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import { User, UserRole } from '../models/user.model';
import { LoginRequest, LoginResponse, RefreshTokenRequest, RefreshTokenResponse } from '../models/auth.model';

/**
 * Servicio de autenticación con soporte para JWT y signals
 * Maneja login, logout, refresh de tokens y estado de usuario
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);

  private readonly apiUrl = `${environment.apiUrl}/api/v1/auth`;

  // Subjects para estado reactivo
  private readonly currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private readonly isLoadingSubject = new BehaviorSubject<boolean>(false);

  // Signals para estado moderno
  private readonly currentUserSignal = signal<User | null>(null);
  private readonly isLoadingSignal = signal<boolean>(false);

  // Observables públicos
  public readonly currentUser$ = this.currentUserSubject.asObservable();
  public readonly isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  public readonly isLoading$ = this.isLoadingSubject.asObservable();

  // Signals públicos (computed)
  public readonly currentUser = computed(() => this.currentUserSignal());
  public readonly isAuthenticated = computed(() => this.currentUserSignal() !== null);
  public readonly isLoading = computed(() => this.isLoadingSignal());
  public readonly userRoles = computed(() => this.currentUserSignal()?.roles || []);
  public readonly isAdmin = computed(() => 
    this.userRoles().some(role => role.name === 'ADMIN')
  );

  // Timer para refresh automático
  private refreshTimer?: ReturnType<typeof timer>;

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Inicializa el estado de autenticación al arrancar la aplicación
   */
  private initializeAuthState(): void {
    const token = this.storageService.getAccessToken();
    const user = this.storageService.getUser();

    if (token && user && !this.isTokenExpired(token)) {
      this.setAuthenticatedUser(user);
      this.scheduleTokenRefresh(token);
    } else {
      this.clearAuthState();
    }
  }

  /**
   * Realizar login con credenciales
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    this.setLoading(true);

    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleSuccessfulAuthentication(response);
        }),
        catchError(error => {
          console.error('Login failed:', error);
          this.clearAuthState();
          return this.handleAuthError(error);
        }),
        finalize(() => {
          this.setLoading(false);
        })
      );
  }

  /**
   * Realizar logout
   */
  logout(redirectToLogin: boolean = true): void {
    const refreshToken = this.storageService.getRefreshToken();

    // Llamar al endpoint de logout si existe refresh token
    if (refreshToken) {
      this.http.post(`${this.apiUrl}/logout`, { refreshToken })
        .subscribe({
          next: () => console.info('Logout successful on server'),
          error: (error) => console.warn('Logout failed on server:', error)
        });
    }

    this.clearAuthState();

    if (redirectToLogin) {
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Refrescar token de acceso
   */
  refreshToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.storageService.getRefreshToken();

    if (!refreshToken || this.isTokenExpired(refreshToken)) {
      console.warn('No valid refresh token available');
      this.logout();
      return throwError(() => new Error('No valid refresh token'));
    }

    const request: RefreshTokenRequest = { refreshToken };

    return this.http.post<RefreshTokenResponse>(`${this.apiUrl}/refresh`, request)
      .pipe(
        tap(response => {
          this.updateTokens(response.accessToken, response.refreshToken);
          this.scheduleTokenRefresh(response.accessToken);
        }),
        catchError(error => {
          console.error('Token refresh failed:', error);
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh silencioso (sin UI feedback)
   */
  silentRefresh(): Observable<boolean> {
    return this.refreshToken().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /**
   * Validar token almacenado y establecer usuario
   */
  validateStoredToken(token: string): void {
    if (this.isTokenExpired(token)) {
      this.logout();
      return;
    }

    const user = this.storageService.getUser();
    if (user) {
      this.setAuthenticatedUser(user);
      this.scheduleTokenRefresh(token);
    }
  }

  /**
   * Verificar si un token está expirado
   */
  isTokenExpired(token: string): boolean {
    try {
      const payload = this.decodeToken(token);
      const now = Math.floor(Date.now() / 1000);
      return payload.exp <= now;
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  }

  /**
   * Obtener información del token
   */
  getTokenInfo(token: string): any {
    try {
      return this.decodeToken(token);
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  /**
   * Verificar si el usuario tiene un rol específico
   */
  hasRole(roleName: string): boolean {
    const user = this.currentUserSignal();
    return user?.roles.some(role => role.name === roleName) || false;
  }

  /**
   * Verificar si el usuario tiene cualquiera de los roles especificados
   */
  hasAnyRole(roleNames: string[]): boolean {
    const user = this.currentUserSignal();
    if (!user?.roles) return false;
    
    return roleNames.some(roleName => 
      user.roles.some(role => role.name === roleName)
    );
  }

  /**
   * Obtener permisos del usuario actual
   */
  getUserPermissions(): string[] {
    const user = this.currentUserSignal();
    if (!user?.roles) return [];

    return user.roles.reduce((permissions: string[], role: UserRole) => {
      return permissions.concat(role.permissions || []);
    }, []);
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getUserPermissions();
    return permissions.includes(permission);
  }

  // Métodos privados
  private handleSuccessfulAuthentication(response: LoginResponse): void {
    // Almacenar tokens
    this.storageService.setAccessToken(response.accessToken);
    if (response.refreshToken) {
      this.storageService.setRefreshToken(response.refreshToken);
    }

    // Establecer usuario
    this.setAuthenticatedUser(response.user);

    // Programar refresh automático
    this.scheduleTokenRefresh(response.accessToken);

    // Redirigir si hay URL guardada
    const redirectUrl = this.storageService.getItem('redirectUrl');
    if (redirectUrl) {
      this.storageService.removeItem('redirectUrl');
      this.router.navigateByUrl(redirectUrl);
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  private setAuthenticatedUser(user: User): void {
    this.currentUserSignal.set(user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    this.storageService.setUser(user);
  }

  private clearAuthState(): void {
    this.currentUserSignal.set(null);
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.storageService.clearAuthData();
    
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }

  private setLoading(loading: boolean): void {
    this.isLoadingSignal.set(loading);
    this.isLoadingSubject.next(loading);
  }

  private updateTokens(accessToken: string, refreshToken: string): void {
    this.storageService.setAccessToken(accessToken);
    this.storageService.setRefreshToken(refreshToken);
  }

  private scheduleTokenRefresh(token: string): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }

    try {
      const payload = this.decodeToken(token);
      const exp = payload.exp * 1000; // Convertir a milliseconds
      const now = Date.now();
      const refreshTime = exp - now - (5 * 60 * 1000); // 5 minutos antes

      if (refreshTime > 0) {
        this.refreshTimer = timer(refreshTime).subscribe(() => {
          console.info('Auto-refreshing token...');
          this.silentRefresh().subscribe();
        });
      }
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }

  private decodeToken(token: string): any {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  }

  private handleAuthError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Error de autenticación';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.status === 401) {
      errorMessage = 'Credenciales inválidas';
    } else if (error.status === 403) {
      errorMessage = 'Acceso denegado';
    } else if (error.status === 0) {
      errorMessage = 'Error de conexión con el servidor';
    }

    return throwError(() => new Error(errorMessage));
  }
}