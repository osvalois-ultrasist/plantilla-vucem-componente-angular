import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

/**
 * Guard que verifica si el usuario está autenticado
 * Implementa CanActivate y CanActivateChild para proteger rutas
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);

  /**
   * Verifica si el usuario puede activar la ruta
   */
  canActivate(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuthentication();
  }

  /**
   * Verifica si el usuario puede activar rutas hijas
   */
  canActivateChild(): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkAuthentication();
  }

  /**
   * Lógica central de verificación de autenticación
   */
  private checkAuthentication(): Observable<boolean | UrlTree> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          // Usuario autenticado - verificar si el token sigue siendo válido
          return this.validateTokenAndProceed();
        } else {
          // Usuario no autenticado - verificar si hay un token almacenado
          return this.checkStoredTokenAndProceed();
        }
      })
    );
  }

  /**
   * Valida el token actual y permite el acceso o redirige
   */
  private validateTokenAndProceed(): boolean | UrlTree {
    const token = this.storageService.getAccessToken();
    
    if (!token) {
      console.warn('AuthGuard: No access token found, redirecting to login');
      return this.redirectToLogin();
    }

    if (this.authService.isTokenExpired(token)) {
      console.warn('AuthGuard: Token expired, attempting refresh');
      
      // Intentar refrescar el token
      const refreshToken = this.storageService.getRefreshToken();
      if (refreshToken && !this.authService.isTokenExpired(refreshToken)) {
        this.authService.refreshToken().subscribe({
          next: () => {
            console.info('AuthGuard: Token refreshed successfully');
          },
          error: (error) => {
            console.error('AuthGuard: Token refresh failed', error);
            this.authService.logout();
          }
        });
        return true; // Permitir acceso mientras se refresca
      } else {
        console.warn('AuthGuard: Refresh token invalid, logging out');
        this.authService.logout();
        return this.redirectToLogin();
      }
    }

    return true;
  }

  /**
   * Verifica si hay un token almacenado e intenta autenticar
   */
  private checkStoredTokenAndProceed(): boolean | UrlTree {
    const token = this.storageService.getAccessToken();
    
    if (!token) {
      console.info('AuthGuard: No stored token, redirecting to login');
      return this.redirectToLogin();
    }

    if (this.authService.isTokenExpired(token)) {
      console.warn('AuthGuard: Stored token expired, attempting refresh');
      
      const refreshToken = this.storageService.getRefreshToken();
      if (refreshToken && !this.authService.isTokenExpired(refreshToken)) {
        // Intentar autenticación silenciosa
        this.authService.silentRefresh().subscribe({
          next: () => {
            console.info('AuthGuard: Silent refresh successful');
          },
          error: (error) => {
            console.error('AuthGuard: Silent refresh failed', error);
            this.authService.logout();
          }
        });
        return true;
      } else {
        console.warn('AuthGuard: Refresh token expired, cleaning up and redirecting');
        this.storageService.clearAuthData();
        return this.redirectToLogin();
      }
    }

    // Token válido encontrado - establecer estado de autenticación
    this.authService.validateStoredToken(token);
    return true;
  }

  /**
   * Redirige al usuario a la página de login
   */
  private redirectToLogin(): UrlTree {
    // Guardar la URL de destino para redirigir después del login
    const currentUrl = this.router.url;
    if (currentUrl !== '/auth/login' && currentUrl !== '/') {
      this.storageService.setItem('redirectUrl', currentUrl);
    }

    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: currentUrl }
    });
  }
}