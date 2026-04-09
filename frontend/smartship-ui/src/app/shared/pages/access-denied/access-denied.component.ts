import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div style="padding:16px;display:flex;justify-content:center">
      <mat-card style="max-width:600px;width:100%">
        <mat-card-title>Access Denied</mat-card-title>
        <mat-card-content>You do not have permission to access this page.</mat-card-content>
      </mat-card>
    </div>
  `,
})
export class AccessDeniedComponent {}
