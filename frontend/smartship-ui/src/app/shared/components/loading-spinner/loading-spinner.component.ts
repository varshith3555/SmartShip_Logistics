import { AsyncPipe, NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [NgIf, AsyncPipe, MatProgressSpinnerModule],
  template: `
    <div class="backdrop" *ngIf="loading.loading$ | async">
      <mat-progress-spinner mode="indeterminate" diameter="48" />
    </div>
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        display: grid;
        place-items: center;
        background: rgba(0, 0, 0, 0.25);
        z-index: 9999;
      }
    `,
  ],
})
export class LoadingSpinnerComponent {
  readonly loading = inject(LoadingService);
}
