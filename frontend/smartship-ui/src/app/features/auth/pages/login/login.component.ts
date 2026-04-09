import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notify = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit(): void {
    if (this.form.invalid) return;

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        const role = (this.auth.role ?? '').toUpperCase();
        const returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
        this.notify.success('Logged in');
        if (returnUrl) {
          this.router.navigateByUrl(returnUrl);
        } else {
          this.router.navigate([role === 'ADMIN' ? '/admin' : '/dashboard']);
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        this.notify.error(err?.error?.message || 'Login failed. Please check your credentials.');
      }
    });
  }

  onGoogleLogin(): void {
    const returnUrl = this.safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    this.auth.beginGoogleLogin(returnUrl ?? undefined);
  }

  private safeReturnUrl(raw: string | null): string | null {
    if (!raw) return null;
    // Avoid open redirects
    return raw.startsWith('/') ? raw : null;
  }
}
