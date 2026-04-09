import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../tokens/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  url(path: string): string {
    if (/^https?:\/\//i.test(path)) return path;
    const base = this.baseUrl.replace(/\/+$/, '');
    const p = path.startsWith('/') ? path : `/${path}`;
    return `${base}${p}`;
  }

  get<T>(path: string, options?: { context?: HttpContext; params?: Record<string, string> }): Observable<T> {
    return this.http.get<T>(this.url(path), options);
  }

  post<T>(path: string, body: unknown, options?: { context?: HttpContext }): Observable<T> {
    return this.http.post<T>(this.url(path), body, options);
  }

  put<T>(path: string, body: unknown, options?: { context?: HttpContext }): Observable<T> {
    return this.http.put<T>(this.url(path), body, options);
  }

  patch<T>(path: string, body: unknown, options?: { context?: HttpContext }): Observable<T> {
    return this.http.patch<T>(this.url(path), body, options);
  }

  delete<T>(path: string, options?: { context?: HttpContext }): Observable<T> {
    return this.http.delete<T>(this.url(path), options);
  }
}
