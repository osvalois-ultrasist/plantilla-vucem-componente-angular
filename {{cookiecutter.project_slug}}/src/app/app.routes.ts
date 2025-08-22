import { Routes } from '@angular/router';

/**
 * Configuración de rutas principales de la aplicación
 * Utiliza lazy loading para optimizar el performance
 */
export const routes: Routes = [
  // Ruta raíz - Redirigir a dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Dashboard principal
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(c => c.DashboardComponent),
    title: 'Dashboard - {{cookiecutter.project_name}}',
    data: { 
      breadcrumb: 'Dashboard',
      roles: ['USER', 'ADMIN'] 
    }
  },

  // Módulo de {{cookiecutter.component_area}}
  {
    path: '{{cookiecutter.component_area}}',
    loadChildren: () => import('./features/{{cookiecutter.component_area}}/{{cookiecutter.component_area}}.routes')
      .then(r => r.{{cookiecutter.component_area | capitalize}}Routes),
    title: '{{cookiecutter.component_area | capitalize}} - {{cookiecutter.project_name}}',
    data: { 
      breadcrumb: '{{cookiecutter.component_area | capitalize}}',
      roles: ['USER', 'ADMIN'] 
    }
  },

  // Autenticación
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes')
      .then(r => r.AuthRoutes),
    title: 'Autenticación - {{cookiecutter.project_name}}'
  },

  // Configuración del usuario
  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile.component')
      .then(c => c.ProfileComponent),
    title: 'Perfil - {{cookiecutter.project_name}}',
    data: { 
      breadcrumb: 'Perfil',
      roles: ['USER', 'ADMIN'] 
    }
  },

  // Configuración del sistema (solo administradores)
  {
    path: 'admin',
    loadChildren: () => import('./features/admin/admin.routes')
      .then(r => r.AdminRoutes),
    title: 'Administración - {{cookiecutter.project_name}}',
    data: { 
      breadcrumb: 'Administración',
      roles: ['ADMIN'] 
    }
  },

  // Ayuda y documentación
  {
    path: 'help',
    loadComponent: () => import('./features/help/help.component')
      .then(c => c.HelpComponent),
    title: 'Ayuda - {{cookiecutter.project_name}}',
    data: { breadcrumb: 'Ayuda' }
  },

  // Página de error 404
  {
    path: '404',
    loadComponent: () => import('./shared/components/not-found/not-found.component')
      .then(c => c.NotFoundComponent),
    title: 'Página no encontrada - {{cookiecutter.project_name}}'
  },

  // Página de error 403 - Sin permisos
  {
    path: '403',
    loadComponent: () => import('./shared/components/forbidden/forbidden.component')
      .then(c => c.ForbiddenComponent),
    title: 'Acceso denegado - {{cookiecutter.project_name}}'
  },

  // Página de error 500 - Error del servidor
  {
    path: '500',
    loadComponent: () => import('./shared/components/server-error/server-error.component')
      .then(c => c.ServerErrorComponent),
    title: 'Error del servidor - {{cookiecutter.project_name}}'
  },

  // Mantenimiento
  {
    path: 'maintenance',
    loadComponent: () => import('./shared/components/maintenance/maintenance.component')
      .then(c => c.MaintenanceComponent),
    title: 'Mantenimiento - {{cookiecutter.project_name}}'
  },

  // Ruta comodín - Captura todas las rutas no definidas
  {
    path: '**',
    redirectTo: '/404'
  }
];

/**
 * Configuración adicional para el router
 */
export const routerConfig = {
  // Habilitar tracing del router en desarrollo
  enableTracing: false, // Cambiar a true para debug
  
  // Estrategia de precarga de módulos lazy
  preloadingStrategy: 'PreloadAllModules', // O 'NoPreloading' para optimizar
  
  // Configuración de scroll
  scrollPositionRestoration: 'top',
  
  // Configuración de hash
  useHash: false,
  
  // Configuración de título
  initialNavigation: 'enabledBlocking'
};

/**
 * Utilidades para rutas
 */
export class RouteUtils {
  
  /**
   * Construye la ruta completa para un módulo específico
   */
  static buildRoute(module: string, action?: string, id?: string): string {
    let route = `/${module}`;
    
    if (action) {
      route += `/${action}`;
    }
    
    if (id) {
      route += `/${id}`;
    }
    
    return route;
  }
  
  /**
   * Verifica si una ruta requiere autenticación
   */
  static requiresAuth(route: string): boolean {
    const publicRoutes = ['/auth', '/help', '/404', '/403', '/500', '/maintenance'];
    return !publicRoutes.some(publicRoute => route.startsWith(publicRoute));
  }
  
  /**
   * Obtiene los roles requeridos para una ruta
   */
  static getRequiredRoles(route: string): string[] {
    if (route.startsWith('/admin')) {
      return ['ADMIN'];
    }
    
    if (RouteUtils.requiresAuth(route)) {
      return ['USER'];
    }
    
    return [];
  }
  
  /**
   * Construye breadcrumbs para una ruta
   */
  static buildBreadcrumbs(route: string): Array<{label: string, url: string}> {
    const segments = route.split('/').filter(segment => segment);
    const breadcrumbs = [];
    let currentUrl = '';
    
    for (const segment of segments) {
      currentUrl += `/${segment}`;
      breadcrumbs.push({
        label: segment.charAt(0).toUpperCase() + segment.slice(1),
        url: currentUrl
      });
    }
    
    return breadcrumbs;
  }
}