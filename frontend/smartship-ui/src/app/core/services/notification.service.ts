import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly snackBar: MatSnackBar) {}

  success(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }

  error(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 5000 });
  }

  info(message: string): void {
    this.snackBar.open(message, 'OK', { duration: 3000 });
  }
}
