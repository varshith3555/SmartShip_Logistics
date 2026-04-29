import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../../core/services/admin.service';
import { ShipmentException } from '../../../../core/models/admin.models';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-exceptions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './admin-exceptions.component.html',
  styleUrls: ['./admin-exceptions.component.scss'],
})
export class AdminExceptionsComponent {
  private readonly api = inject(AdminService);
  private readonly notify = inject(NotificationService);

  private readonly resolving = new Set<string>();

  all: ShipmentException[] = [];
  rows: ShipmentException[] = [];
  cols = ['exceptionId', 'shipmentId', 'type', 'status', 'createdAt', 'description', 'actions'];
  loaded = false;
  loadError = false;
  filter: 'OPEN' | 'RESOLVED' = 'OPEN';

  constructor() {
    this.reload();
  }

  onFilterChange(value: 'OPEN' | 'RESOLVED'): void {
    this.filter = value;
    this.applyFilter();
  }

  isOpen(e: ShipmentException): boolean {
    const v = (e.status ?? '').toUpperCase();
    return v === 'OPEN';
  }

  isResolving(e: ShipmentException): boolean {
    return this.resolving.has(e.exceptionId);
  }

  resolve(e: ShipmentException): void {
    if (!this.isOpen(e) || this.isResolving(e)) return;
    this.resolving.add(e.exceptionId);
    this.api.resolveShipment(e.shipmentId, { resolutionDetails: 'Resolved' }).subscribe({
      next: () => {
        this.reload();
        this.notify.success('Exception resolved');
        this.resolving.delete(e.exceptionId);
      },
      error: () => {
        this.notify.error('Failed to resolve exception');
        this.resolving.delete(e.exceptionId);
      },
    });
  }

  private reload(): void {
    this.loaded = false;
    this.loadError = false;
    this.api.getAllExceptions().subscribe({
      next: (e) => {
        this.all = e;
        this.applyFilter();
        this.loaded = true;
      },
      error: () => {
        this.loadError = true;
        this.notify.error('Failed to load exceptions');
        this.loaded = true;
      },
    });
  }

  private applyFilter(): void {
    this.rows = this.all.filter((e) => {
      const status = (e.status ?? '').toUpperCase();
      if (this.filter === 'OPEN') {
        return status === 'OPEN';
      }
      // Closed/Resolved filter
      return status === 'RESOLVED';
    });
  }
}
