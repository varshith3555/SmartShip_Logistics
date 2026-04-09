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
import { ShipmentService } from '../../../../core/services/shipment.service';
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
  template: `
    <div class="sss-page">
      <h1 class="sss-title">Manage shipments</h1>
      <p class="sss-sub">Review all shipments, filter by status, and take action.</p>

      <mat-card class="toolbar-card">
        <mat-card-content class="toolbar">
          <mat-form-field appearance="outline" class="filter">
            <mat-label>Status</mat-label>
            <mat-select [value]="statusFilter" (selectionChange)="onFilterChange($event.value)">
              <mat-option value="ALL">All</mat-option>
              <mat-option value="CREATED">Created</mat-option>
              <mat-option value="BOOKED">Booked</mat-option>
              <mat-option value="IN TRANSIT">In transit</mat-option>
              <mat-option value="OUT FOR DELIVERY">Out for delivery</mat-option>
              <mat-option value="DELIVERED">Delivered</mat-option>
              <mat-option value="DELAYED">Delayed</mat-option>
              <mat-option value="CANCELLED">Cancelled</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="search">
            <mat-label>Search by Tracking ID</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [value]="trackingQuery" (input)="onTrackingQueryChange(($any($event.target).value || '').toString())" />
          </mat-form-field>

          <span class="count">{{ filtered.length }} shown</span>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="wrap">
          <div class="sk" *ngIf="!loaded">
            <div class="sk-row" *ngFor="let _ of [1, 2, 3, 4, 5]">
              <div class="sk-cell sk-cell--lg"></div>
              <div class="sk-cell sk-cell--md"></div>
              <div class="sk-cell sk-cell--sm"></div>
              <div class="sk-cell sk-cell--md"></div>
              <div class="sk-cell sk-cell--xs"></div>
            </div>
          </div>

          <table mat-table [dataSource]="paged" class="tbl" *ngIf="loaded">
            <ng-container matColumnDef="shipmentId">
              <th mat-header-cell *matHeaderCellDef>Shipment ID</th>
              <td mat-cell *matCellDef="let s">
                <span class="mono">{{ s.shipmentId }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="trackingNumber">
              <th mat-header-cell *matHeaderCellDef>Tracking #</th>
              <td mat-cell *matCellDef="let s">
                <span class="mono">{{ s.trackingNumber }}</span>
              </td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let s">
                <app-status-badge [status]="s.status" />
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let s">{{ s.createdAt | date : 'medium' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="col-actions"></th>
              <td mat-cell *matCellDef="let s" class="col-actions">
                <a mat-stroked-button [routerLink]="['/shipments', s.shipmentId]">
                  <mat-icon>visibility</mat-icon>
                  View
                </a>
                <button mat-flat-button color="primary" type="button" (click)="openUpdate(s)">
                  <mat-icon>edit</mat-icon>
                  Update
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns" class="row"></tr>
          </table>

          <p class="empty" *ngIf="loaded && !filtered.length">No shipments match this filter.</p>
        </mat-card-content>
      </mat-card>

      <mat-paginator
        *ngIf="loaded && filtered.length"
        class="pager"
        [length]="filtered.length"
        [pageIndex]="pageIndex"
        [pageSize]="pageSize"
        [pageSizeOptions]="pageSizeOptions"
        (page)="onPage($event)"
        aria-label="Manage shipments pagination"
      />
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 1200px;
        margin: 0 auto;
      }
      .sss-title {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 650;
      }
      .sss-sub {
        margin: 0 0 16px;
        color: var(--ss-text-muted);
      }
      .toolbar-card {
        margin-bottom: 14px;
      }
      .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding: 8px 4px !important;
      }
      .filter {
        width: 240px;
      }
      .search {
        flex: 1 1 320px;
        min-width: 260px;
      }
      .count {
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
      .wrap {
        padding: 0 !important;
        overflow: auto;
      }
      .tbl {
        width: 100%;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.9rem;
      }
      .col-actions {
        text-align: right;
        white-space: nowrap;
        width: 220px;
      }
      .col-actions a,
      .col-actions button {
        margin-left: 8px;
      }
      .row:hover {
        background: rgba(21, 101, 192, 0.04);
      }
      .empty {
        padding: 22px 16px;
        margin: 0;
        text-align: center;
        color: var(--ss-text-muted);
      }
      .pager {
        margin-top: 10px;
      }
      .sk {
        padding: 8px 0;
      }
      .sk-row {
        display: grid;
        grid-template-columns: 1.4fr 1fr 0.8fr 1fr 220px;
        gap: 12px;
        align-items: center;
        padding: 14px 16px;
        border-bottom: 1px solid var(--ss-border);
      }
      .sk-cell {
        height: 12px;
        border-radius: 999px;
        background: linear-gradient(90deg, #e2e8f0, #f1f5f9, #e2e8f0);
        background-size: 200% 100%;
        animation: shimmer 1.2s ease-in-out infinite;
      }
      .sk-cell--lg {
        width: 80%;
      }
      .sk-cell--md {
        width: 70%;
      }
      .sk-cell--sm {
        width: 55%;
      }
      .sk-cell--xs {
        width: 70%;
        justify-self: end;
      }
      @keyframes shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }
    `,
  ],
})
export class ManageShipmentsComponent {
  private readonly api = inject(ShipmentService);
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
    this.api.getAllShipments().subscribe({
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
