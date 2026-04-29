import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../../core/services/admin.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { ShipmentStatusDialogComponent } from '../../components/shipment-status-dialog/shipment-status-dialog.component';

@Component({
  selector: 'app-manage-shipments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatDialogModule,
    StatusBadgeComponent,
  ],
  templateUrl: './manage-shipments.component.html',
  styleUrls: ['./manage-shipments.component.scss'],
})
export class ManageShipmentsComponent {
  private readonly api = inject(AdminService);
  private readonly dialog = inject(MatDialog);

  shipments: Shipment[] = [];
  filtered: Shipment[] = [];
  paged: Shipment[] = [];
  displayedColumns = ['shipmentId', 'trackingNumber', 'status', 'createdAt', 'actions'];
  statusFilter: string = 'ALL';
  trackingQuery: string = '';

  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25];

  loaded = false;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loaded = false;
    this.api.getShipments().subscribe({
      next: (s) => {
        this.shipments = s;
        this.applyFilter();
        this.loaded = true;
      },
      error: () => {
        this.loaded = true;
      },
    });
  }

  onFilterChange(value: string): void {
    this.statusFilter = value;
    this.applyFilter();
  }

  onTrackingQueryChange(value: string): void {
    this.trackingQuery = value;
    this.applyFilter();
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.applyPaging();
  }

  applyFilter(): void {
    const q = (this.trackingQuery ?? '').trim().toUpperCase();

    let rows = [...this.shipments];

    if (this.statusFilter !== 'ALL') {
      const want = this.normalize(this.statusFilter);
      rows = rows.filter((s) => this.normalize(s.status) === want);
    }

    if (q) {
      rows = rows.filter((s) => (s.trackingNumber ?? '').toUpperCase().includes(q));
    }

    this.filtered = rows;
    this.pageIndex = 0;
    this.applyPaging();
  }

  private applyPaging(): void {
    const start = this.pageIndex * this.pageSize;
    this.paged = this.filtered.slice(start, start + this.pageSize);
  }

  private normalize(status: string): string {
    return status.toUpperCase().replace(/-/g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  }

  openUpdate(s: Shipment): void {
    const ref = this.dialog.open(ShipmentStatusDialogComponent, {
      width: '520px',
      data: { shipmentId: s.shipmentId, currentStatus: s.status },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) this.reload();
    });
  }
}
