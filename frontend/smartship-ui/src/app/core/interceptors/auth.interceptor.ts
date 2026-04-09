import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

function isAuthRefresh(url: string): boolean {
  return url.includes('/gateway/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken;
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      // Don't try to refresh if backend is not reachable
      if (err.status === 0) {
        return throwError(() => err);
      }

      if (err.status !== 401) return throwError(() => err);
      if (isAuthRefresh(req.url)) {
        auth.logout();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      const refreshToken = auth.refreshToken;
      if (!refreshToken) {
        auth.logout();
        router.navigate(['/auth/login']);
        return throwError(() => err);
      }

      return auth.refreshAccessToken().pipe(
        switchMap((res) => {
          const retry = req.clone({ setHeaders: { Authorization: `Bearer ${res.token}` } });
          return next(retry);
        }),
        catchError((refreshErr) => {
          auth.logout();
          router.navigate(['/auth/login']);
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
