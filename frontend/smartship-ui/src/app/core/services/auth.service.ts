import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { ApiClient } from './api-client.service';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  OtpResponse,
  RefreshTokenRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  SignupWithOtpRequest,
  VerifyOtpRequest,
} from '../models/auth.models';
import { decodeJwtPayload, getJwtRole, getJwtUserId } from '../utils/jwt.utils';

const ACCESS_TOKEN_KEY = 'smartship.accessToken';
const REFRESH_TOKEN_KEY = 'smartship.refreshToken';
const USER_NAME_KEY = 'smartship.userName';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);

  private readonly _auth$ = new BehaviorSubject<AuthResponse | null>(this.restoreAuth());
  readonly auth$ = this._auth$.asObservable();
  readonly isAuthenticated$ = this.auth$.pipe(map(auth => !!auth));

  private refreshInFlight?: Observable<AuthResponse>;

  get accessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }

  get role(): string | null {
    const token = this.accessToken;
    const payload = decodeJwtPayload(token);
    return getJwtRole(payload);
  }

  get userId(): string | null {
    const payload = decodeJwtPayload(this.accessToken);
    return getJwtUserId(payload);
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  getCurrentUser(): any {
    const auth = this._auth$.value;
    if (!auth) return null;
    
    const payload = decodeJwtPayload(auth.token);

    const email = String(
      payload?.['email'] ??
        payload?.['upn'] ??
        payload?.['preferred_username'] ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ??
        '',
    ).trim();

    const nameFromPayload = String(
      payload?.['name'] ??
        payload?.['given_name'] ??
        payload?.['unique_name'] ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ??
        '',
    ).trim();

    const nameFromStorage = String(sessionStorage.getItem(USER_NAME_KEY) ?? '').trim();
    const name = String(auth.name ?? '').trim() || nameFromStorage || nameFromPayload;

    return {
      userId: auth.userId,
      name,
      email,
      role: auth.role
    };
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>('/gateway/auth/login', request).pipe(
      tap((res) => this.persistAuth(res)),
    );
  }

  beginGoogleLogin(returnUrl?: string): void {
    const url = returnUrl
      ? `/gateway/auth/google/login?returnUrl=${encodeURIComponent(returnUrl)}`
      : '/gateway/auth/google/login';

    window.location.href = url;
  }

  completeOAuthLogin(tokens: { token: string; refreshToken: string; name?: string }): void {
    const payload = decodeJwtPayload(tokens.token);
    const role = getJwtRole(payload) ?? '';
    const userId = getJwtUserId(payload) ?? '';

    this.persistAuth({
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      userId,
      name: tokens.name ?? '',
      role,
    });
  }

  signupWithOtp(request: SignupWithOtpRequest): Observable<OtpResponse> {
    return this.api.post<OtpResponse>('/gateway/auth/signup', request);
  }

  resendOtp(request: ResendOtpRequest): Observable<OtpResponse> {
    return this.api.post<OtpResponse>('/gateway/auth/resend-otp', request);
  }

  verifyOtp(request: VerifyOtpRequest): Observable<OtpResponse> {
    return this.api.post<OtpResponse>('/gateway/auth/verify-otp', request);
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<OtpResponse> {
    return this.api.post<OtpResponse>('/gateway/auth/forgot-password', request);
  }

  resetPassword(request: ResetPasswordRequest): Observable<OtpResponse> {
    return this.api.post<OtpResponse>('/gateway/auth/reset-password', request);
  }

  logout(): void {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_NAME_KEY);
    this._auth$.next(null);
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) return throwError(() => new Error('Missing refresh token'));

    if (!this.refreshInFlight) {
      const payload: RefreshTokenRequest = { refreshToken };
      this.refreshInFlight = this.api.post<AuthResponse>('/gateway/auth/refresh', payload).pipe(
        tap((res) => this.persistAuth(res)),
        shareReplay(1),
        finalize(() => {
          this.refreshInFlight = undefined;
        }),
        catchError((err) => {
          this.logout();
          return throwError(() => err);
        }),
      );
    }

    return this.refreshInFlight;
  }

  private persistAuth(res: AuthResponse): void {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, res.token);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, res.refreshToken);
    sessionStorage.setItem(USER_NAME_KEY, String(res.name ?? ''));
    this._auth$.next(res);
  }

  private restoreAuth(): AuthResponse | null {
    const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
    const refreshToken = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (!token || !refreshToken) return null;

    const payload = decodeJwtPayload(token);
    const role = getJwtRole(payload) ?? '';
    const userId = getJwtUserId(payload);

    return {
      token,
      refreshToken,
      userId: userId ?? '',
      name: String(sessionStorage.getItem(USER_NAME_KEY) ?? ''),
      role,
    };
  }
}
