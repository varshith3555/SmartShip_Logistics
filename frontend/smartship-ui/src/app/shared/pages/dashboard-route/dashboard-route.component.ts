import { NgIf } from '@angular/common';
import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { AdminDashboardComponent } from '../../../features/admin/pages/dashboard/admin-dashboard.component';
import { DashboardComponent } from '../../../features/customer/pages/dashboard/dashboard.component';

@Component({
  selector: 'app-dashboard-route',
  standalone: true,
  imports: [NgIf, AdminDashboardComponent, DashboardComponent],
  template: `
    <app-admin-dashboard *ngIf="isAdmin; else customer"></app-admin-dashboard>
    <ng-template #customer>
      <app-customer-dashboard></app-customer-dashboard>
    </ng-template>
  `,
})
export class DashboardRouteComponent {
  private readonly auth = inject(AuthService);

  get isAdmin(): boolean {
    return (this.auth.role ?? '').toUpperCase() === 'ADMIN';
  }
}
