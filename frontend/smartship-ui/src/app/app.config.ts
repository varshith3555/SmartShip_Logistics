import { ApplicationConfig } from '@angular/core';
import { importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { DATE_PIPE_DEFAULT_OPTIONS } from '@angular/common';

import { routes } from './app.routes';
import { loadingInterceptor } from './core/interceptors/loading.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    importProvidersFrom(MatSnackBarModule),
    { provide: DATE_PIPE_DEFAULT_OPTIONS, useValue: { timezone: '+0530' } },
    provideHttpClient(withInterceptors([loadingInterceptor, httpErrorInterceptor, authInterceptor])),
  ],
};
