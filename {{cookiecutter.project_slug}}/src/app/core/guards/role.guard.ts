import { Injectable, inject } from '@angular/core';
import { CanActivate, CanActivateChild, ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, map, take } from 'rxjs';

import { AuthService } from '../services/auth.service';
import { User } from '../models/user.model';

/**
 * Guard que verifica si el usuario tiene los roles necesarios
 * Implementa autorización basada en roles (RBAC)
 */
@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate, CanActivateChild {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Verifica si el usuario puede activar la ruta basado en sus roles
   */
  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkRolePermission(route);
  }

  /**
   * Verifica si el usuario puede activar rutas hijas basado en sus roles
   */
  canActivateChild(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    return this.checkRolePermission(route);
  }

  /**
   * Lógica central de verificación de roles
   */
  private checkRolePermission(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    return this.authService.currentUser$.pipe(
      take(1),
      map(user => {
        if (!user) {
          console.warn('RoleGuard: No user found, redirecting to login');
          return this.redirectToLogin();
        }

        return this.validateUserRoles(user, route);
      })
    );
  }

  /**
   * Valida si el usuario tiene los roles requeridos
   */
  private validateUserRoles(user: User, route: ActivatedRouteSnapshot): boolean | UrlTree {
    const requiredRoles = this.extractRequiredRoles(route);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No se requieren roles específicos
      return true;
    }

    const hasRequiredRole = this.userHasRequiredRoles(user, requiredRoles);

    if (!hasRequiredRole) {
      console.warn('RoleGuard: User lacks required roles', {
        userRoles: user.roles,
        requiredRoles,
        userId: user.id
      });
      
      return this.redirectToForbidden();
    }

    console.info('RoleGuard: Access granted', {
      userRoles: user.roles,
      requiredRoles,
      userId: user.id
    });

    return true;
  }

  /**
   * Extrae los roles requeridos de la configuración de la ruta
   */
  private extractRequiredRoles(route: ActivatedRouteSnapshot): string[] {
    // Buscar en data de la ruta actual
    let requiredRoles = route.data?.['roles'] as string[];

    // Si no se encuentra, buscar en rutas padre
    if (!requiredRoles && route.parent) {
      requiredRoles = this.findRolesInParentRoutes(route.parent);
    }

    // Normalizar roles a array si es un string único
    if (typeof requiredRoles === 'string') {
      requiredRoles = [requiredRoles];
    }

    return requiredRoles || [];
  }

  /**
   * Busca roles requeridos en rutas padre
   */
  private findRolesInParentRoutes(route: ActivatedRouteSnapshot): string[] {
    let currentRoute: ActivatedRouteSnapshot | null = route;
    
    while (currentRoute) {
      const roles = currentRoute.data?.['roles'] as string[];
      if (roles && roles.length > 0) {
        return Array.isArray(roles) ? roles : [roles];
      }
      currentRoute = currentRoute.parent;
    }

    return [];
  }

  /**
   * Verifica si el usuario tiene al menos uno de los roles requeridos
   */
  private userHasRequiredRoles(user: User, requiredRoles: string[]): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    // El usuario debe tener al menos uno de los roles requeridos
    const userRoleNames = user.roles.map(role => role.name.toUpperCase());
    const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());

    return normalizedRequiredRoles.some(role => userRoleNames.includes(role));
  }

  /**
   * Verifica si el usuario tiene TODOS los roles requeridos (modo estricto)
   */
  private userHasAllRequiredRoles(user: User, requiredRoles: string[]): boolean {
    if (!user.roles || user.roles.length === 0) {
      return false;
    }

    const userRoleNames = user.roles.map(role => role.name.toUpperCase());
    const normalizedRequiredRoles = requiredRoles.map(role => role.toUpperCase());

    return normalizedRequiredRoles.every(role => userRoleNames.includes(role));
  }

  /**
   * Verifica si el usuario tiene un rol específico
   */
  public static hasRole(user: User | null, roleName: string): boolean {
    if (!user?.roles) {
      return false;
    }

    return user.roles.some(role => 
      role.name.toUpperCase() === roleName.toUpperCase()
    );
  }

  /**
   * Verifica si el usuario tiene cualquiera de los roles especificados
   */
  public static hasAnyRole(user: User | null, roleNames: string[]): boolean {
    if (!user?.roles || roleNames.length === 0) {
      return false;
    }

    const normalizedRoleNames = roleNames.map(name => name.toUpperCase());
    return user.roles.some(role => 
      normalizedRoleNames.includes(role.name.toUpperCase())
    );
  }

  /**
   * Verifica si el usuario tiene todos los roles especificados
   */
  public static hasAllRoles(user: User | null, roleNames: string[]): boolean {
    if (!user?.roles || roleNames.length === 0) {
      return false;
    }

    const userRoleNames = user.roles.map(role => role.name.toUpperCase());
    const normalizedRoleNames = roleNames.map(name => name.toUpperCase());
    
    return normalizedRoleNames.every(role => userRoleNames.includes(role));
  }

  /**
   * Redirige al usuario a la página de login
   */
  private redirectToLogin(): UrlTree {
    return this.router.createUrlTree(['/auth/login']);
  }

  /**
   * Redirige al usuario a la página de acceso denegado
   */
  private redirectToForbidden(): UrlTree {
    return this.router.createUrlTree(['/403']);
  }
}