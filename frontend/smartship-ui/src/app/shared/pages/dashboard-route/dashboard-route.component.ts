import { NgComponentOutlet, NgIf } from '@angular/common';
import { Component, inject, OnInit, Type } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-route',
  standalone: true,
  imports: [NgIf, NgComponentOutlet],
  templateUrl: './dashboard-route.component.html',
})
export class DashboardRouteComponent implements OnInit {
  private readonly auth = inject(AuthService);

  dashboardComponent: Type<unknown> | null = null;

  get isAdmin(): boolean {
    return (this.auth.role ?? '').toUpperCase() === 'ADMIN';
  }

  async ngOnInit(): Promise<void> {
    if (this.isAdmin) {
      const m = await import('../../../features/admin/pages/dashboard/admin-dashboard.component');
      this.dashboardComponent = m.AdminDashboardComponent;
      return;
    }

    const m = await import('../../../features/customer/pages/dashboard/dashboard.component');
    this.dashboardComponent = m.DashboardComponent;
  }
}
