import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './oauth-callback.component.html',
  styleUrls: ['./oauth-callback.component.scss'],
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);

  ngOnInit(): void {
    const fragment = this.route.snapshot.fragment ?? '';
    const params = new URLSearchParams(fragment);

    const error = params.get('error');
    if (error) {
      this.notify.error(error);
      this.router.navigate(['/auth/login']);
      return;
    }

    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const returnUrl = this.safeReturnUrl(params.get('returnUrl'));

    if (!token || !refreshToken) {
      this.notify.error('OAuth login failed. Please try again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.auth.completeOAuthLogin({ token, refreshToken });

    const role = (this.auth.role ?? '').toUpperCase();
    this.notify.success('Logged in');

    if (returnUrl) {
      this.router.navigateByUrl(returnUrl);
      return;
    }

    this.router.navigate([role === 'ADMIN' ? '/admin' : '/dashboard']);
  }

  private safeReturnUrl(raw: string | null): string | null {
    if (!raw) return null;
    return raw.startsWith('/') ? raw : null;
  }
}
