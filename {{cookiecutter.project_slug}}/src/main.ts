import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
{% if cookiecutter.state_management == 'ngrx' %}
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideRouterStore } from '@ngrx/router-store';
{% endif %}
{% if cookiecutter.enable_pwa == 'true' %}
import { provideServiceWorker } from '@angular/service-worker';
{% endif %}
{% if cookiecutter.enable_ssr == 'true' %}
import { provideClientHydration } from '@angular/platform-browser';
{% endif %}

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { coreProviders } from './app/core/providers';
{% if cookiecutter.state_management == 'ngrx' %}
import { appReducers } from './app/store/app.reducers';
import { AppEffects } from './app/store/app.effects';
{% endif %}
import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    // Router
    provideRouter(
      routes,
      withEnabledBlockingInitialNavigation()
    ),
    
    // HTTP Client
    provideHttpClient(withInterceptorsFromDi()),
    
    // Animations
    provideAnimationsAsync(),
    
    {% if cookiecutter.enable_ssr == 'true' %}
    // SSR Hydration
    provideClientHydration(),
    
    {% endif %}
    {% if cookiecutter.state_management == 'ngrx' %}
    // NgRx Store
    provideStore(appReducers),
    provideEffects([AppEffects]),
    provideRouterStore(),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
      autoPause: true,
      trace: false,
      traceLimit: 75
    }),
    
    {% endif %}
    {% if cookiecutter.enable_pwa == 'true' %}
    // Service Worker
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    }),
    
    {% endif %}
    // Core Providers
    ...coreProviders
  ]
}).catch(err => console.error(err));