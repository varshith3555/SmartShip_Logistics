import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { trimRequired } from '../../../../shared/validators/trim-required.validator';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    RouterLink,
    StatusBadgeComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent {
  private readonly auth        = inject(AuthService);
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly shipmentsApi = inject(ShipmentService);

  readonly trackForm = this.fb.group({
    trackingNumber: ['', [trimRequired]],
  });
  shipmentsLoaded = false;
  recent: Shipment[] = [];
  readonly recentCols = ['trackingNumber', 'status', 'createdAt', 'actions'];
  private readonly recentLimit = 4;

  metrics: { total: number; inTransit: number; delivered: number; pendingDelayed: number } = {
    total: 0, inTransit: 0, delivered: 0, pendingDelayed: 0,
  };

  get role(): string | null { return this.auth.role; }

  get firstName(): string {
    const user = this.auth.getCurrentUser();
    if (user?.name) return user.name.split(' ')[0];
    if (user?.email) {
      const local = user.email.split('@')[0];
      return local.charAt(0).toUpperCase() + local.slice(1);
    }
    return this.role ?? 'there';
  }

  get timeOfDay(): string {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  constructor() {
    this.shipmentsApi.getMyShipments().subscribe({
      next: (rows) => {
        const sorted = [...rows].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.recent = sorted.slice(0, this.recentLimit);
        this.updateMetrics(rows);
        this.shipmentsLoaded = true;
      },
      error: () => { this.shipmentsLoaded = true; },
    });
  }

  private updateMetrics(rows: Shipment[]): void {
    const totals = { total: rows.length, inTransit: 0, delivered: 0, pendingDelayed: 0 };
    for (const s of rows) {
      const raw = (s.status || '').toUpperCase();
      if (!raw) continue;
      if (raw.includes('DELIVERED') || raw.includes('COMPLETED')) { totals.delivered++; continue; }
      if (raw.includes('TRANSIT') || raw.includes('PICKUP') || raw.includes('OUT FOR')) totals.inTransit++;
      if (raw.includes('PENDING') || raw.includes('DELAY') || raw.includes('CREATED') ||
          raw.includes('BOOKED') || raw.includes('WAREHOUSE') || raw.includes('PROCESS')) {
        totals.pendingDelayed++;
      }
    }
    this.metrics = totals;
  }

  goTrack(): void {
    if (this.trackForm.invalid) return;
    const tn = (this.trackForm.getRawValue().trackingNumber ?? '').trim();
    if (!tn) return;
    this.router.navigate(['/tracking'], { queryParams: { tn } });
  }
}
