import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LandingNavbarComponent } from '../../components/navbar/landing-navbar.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    LandingNavbarComponent
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  passwordForm: FormGroup;
  userInfo: any = {};

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern(/^\+?[\d\s-()]+$/)]],
      address: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userInfo = user;
      this.profileForm.patchValue({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || ''
      });
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      console.log('Profile updated:', this.profileForm.value);
      this.snackBar.open('Profile updated successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      const { newPassword, confirmPassword } = this.passwordForm.value;
      
      if (newPassword !== confirmPassword) {
        this.snackBar.open('Passwords do not match!', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
        return;
      }

      console.log('Password changed');
      this.snackBar.open('Password changed successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.passwordForm.reset();
    }
  }
}
