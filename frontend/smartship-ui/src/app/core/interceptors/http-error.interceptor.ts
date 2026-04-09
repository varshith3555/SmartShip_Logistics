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
import { catchError } from 'rxjs/operators';
import { NotificationService } from '../services/notification.service';

function extractMessage(err: HttpErrorResponse): string {
  const body = err.error;

  if (typeof body === 'string') return body;
  if (body && typeof body === 'object') {
    if (typeof body.message === 'string') return body.message;

    // ASP.NET validation dictionary often looks like: { errors: { Field: ["..."] } } or direct { Field: [..] }
    const maybeErrors = (body as any).errors ?? body;
    if (maybeErrors && typeof maybeErrors === 'object') {
      const firstKey = Object.keys(maybeErrors)[0];
      const firstVal = (maybeErrors as any)[firstKey];
      if (Array.isArray(firstVal) && typeof firstVal[0] === 'string') return firstVal[0];
    }
  }

  return 'An unexpected error occurred.';
}

export const httpErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> => {
  const notify = inject(NotificationService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse)) return throwError(() => err);

      // Handle connection errors (backend not running)
      if (err.status === 0) {
        notify.error('Cannot connect to server. Please ensure the backend services are running.');
        console.error('Backend connection failed. Check if services are running on:', err.url);
        return throwError(() => err);
      }

      if (err.status === 400) {
        notify.error(extractMessage(err));
      } else if (err.status === 401) {
        // Auth interceptor will attempt refresh; if it still bubbles up, send user to login.
        router.navigate(['/auth/login']);
      } else if (err.status === 403) {
        router.navigate(['/access-denied']);
      } else if (err.status >= 500) {
        notify.error('Server error. Please try again later.');
      }

      return throwError(() => err);
    }),
  );
};
