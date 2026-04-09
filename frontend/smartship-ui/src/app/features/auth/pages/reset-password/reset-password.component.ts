import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (!newPassword || !confirmPassword) return null;
  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
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
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  isSubmitting = false;

  readonly form = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [matchPasswords] },
  );

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.form.patchValue({ email });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isSubmitting) return;
    this.isSubmitting = true;

    const { email, otp, newPassword } = this.form.getRawValue();
    this.auth.resetPassword({ email, otp, newPassword }).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'Password reset successfully');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('Reset password error:', err);
        this.notify.error(err?.error?.message || 'Failed to reset password. Please try again.');
      },
      complete: () => {
        this.isSubmitting = false;
      },
    });
  }

  get passwordMismatch(): boolean {
    return !!this.form.errors?.['passwordMismatch'] && (this.form.get('confirmPassword')?.touched ?? false);
  }
}
