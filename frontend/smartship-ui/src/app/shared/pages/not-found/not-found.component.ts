import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [MatCardModule],
  template: `
    <div style="padding:16px;display:flex;justify-content:center">
      <mat-card style="max-width:600px;width:100%">
        <mat-card-title>Page Not Found</mat-card-title>
        <mat-card-content>The requested page does not exist.</mat-card-content>
      </mat-card>
    </div>
  `,
})
export class NotFoundComponent {}
