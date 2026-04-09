import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-verify-otp',
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
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.scss']
})
export class VerifyOtpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
  });

  isResending = false;

  constructor() {
    const email = this.route.snapshot.queryParamMap.get('email');
    if (email) this.form.patchValue({ email });
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.auth.verifyOtp(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'OTP verified');
        // Backend returns OtpResponse, so proceed to login.
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        console.error('OTP verification error:', err);
        this.notify.error(err?.error?.message || 'OTP verification failed. Please try again.');
      }
    });
  }

  onResendOtp(): void {
    const email = this.form.controls.email.value;
    if (!email || this.form.controls.email.invalid) {
      this.notify.error('Please enter a valid email first.');
      return;
    }

    if (this.isResending) return;
    this.isResending = true;

    this.auth.resendOtp({ email }).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'OTP resent');
      },
      error: (err) => {
        console.error('Resend OTP error:', err);
        this.notify.error(err?.error?.message || 'Failed to resend OTP. Please try again.');
      },
      complete: () => {
        this.isResending = false;
      }
    });
  }
}
