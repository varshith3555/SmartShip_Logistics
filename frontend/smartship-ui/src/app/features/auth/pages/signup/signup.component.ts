import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { phone10Digits } from '../../../../shared/validators/phone-10digits.validator';

const PASSWORD_STRENGTH_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const passwordsMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const group = control as unknown as { get?: (name: string) => AbstractControl | null };
  const password = group.get?.('password')?.value;
  const confirmPassword = group.get?.('confirmPassword')?.value;

  if (!password || !confirmPassword) return null;

  return password === confirmPassword ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-signup',
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
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss']
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required, phone10Digits]],
    password: [
      '',
      [Validators.required, Validators.minLength(8), Validators.pattern(PASSWORD_STRENGTH_REGEX)],
    ],
    confirmPassword: ['', [Validators.required]],
  }, { validators: [passwordsMatchValidator] });

  onSubmit(): void {
    if (this.form.invalid) return;

    const value = this.form.getRawValue();
    this.auth.signupWithOtp(value).subscribe({
      next: (res) => {
        this.notify.success(res.message || 'OTP sent');
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email: value.email } });
      },
      error: (err) => {
        console.error('Signup error:', err);
        this.notify.error(err?.error?.message || 'Signup failed. Please try again.');
      }
    });
  }
}
