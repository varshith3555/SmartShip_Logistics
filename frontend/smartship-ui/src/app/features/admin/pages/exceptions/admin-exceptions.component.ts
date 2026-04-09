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
  template: `
    <div class="sss-page">
      <h1 class="sss-title">Exceptions</h1>
      <p class="sss-sub">Open shipment exceptions that need attention.</p>

      <mat-card class="toolbar-card">
        <mat-card-content class="toolbar">
          <mat-form-field appearance="outline" class="filter">
            <mat-label>Filter</mat-label>
            <mat-select [value]="filter" (selectionChange)="onFilterChange($event.value)">
              <mat-option value="OPEN">Open</mat-option>
              <mat-option value="RESOLVED">Resolved</mat-option>
            </mat-select>
          </mat-form-field>
          <span class="count">{{ rows.length }} shown</span>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-content class="wrap">
          <div class="sk" *ngIf="!loaded">
            <div class="sk-row" *ngFor="let _ of [1, 2, 3, 4, 5]">
              <div class="sk-cell sk--sm"></div>
              <div class="sk-cell sk--md"></div>
              <div class="sk-cell sk--lg"></div>
              <div class="sk-cell sk--sm"></div>
              <div class="sk-cell sk--sm"></div>
              <div class="sk-cell sk--md"></div>
              <div class="sk-cell sk--xs"></div>
            </div>
          </div>

          <table mat-table [dataSource]="rows" class="tbl" *ngIf="loaded">
            <ng-container matColumnDef="exceptionId">
              <th mat-header-cell *matHeaderCellDef>Exception</th>
              <td mat-cell *matCellDef="let e"><span class="mono">{{ e.exceptionId }}</span></td>
            </ng-container>

            <ng-container matColumnDef="shipmentId">
              <th mat-header-cell *matHeaderCellDef>Shipment</th>
              <td mat-cell *matCellDef="let e">
                <a class="mono" [routerLink]="['/shipments', e.shipmentId]">{{ e.shipmentId }}</a>
              </td>
            </ng-container>

            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Type</th>
              <td mat-cell *matCellDef="let e">{{ e.type }}</td>
            </ng-container>

            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let e">
                <span class="status" [class.status--open]="isOpen(e)" [class.status--closed]="!isOpen(e)">
                  {{ isOpen(e) ? 'OPEN' : 'RESOLVED' }}
                </span>
              </td>
            </ng-container>

            <ng-container matColumnDef="createdAt">
              <th mat-header-cell *matHeaderCellDef>Created</th>
              <td mat-cell *matCellDef="let e">{{ e.createdAt | date : 'medium' }}</td>
            </ng-container>

            <ng-container matColumnDef="description">
              <th mat-header-cell *matHeaderCellDef>Description</th>
              <td mat-cell *matCellDef="let e">{{ e.description }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="ar">Action</th>
              <td mat-cell *matCellDef="let e" class="ar">
                <button
                  mat-stroked-button
                  color="primary"
                  type="button"
                  class="btn-small"
                  (click)="resolve(e)"
                  [disabled]="!isOpen(e) || isResolving(e)"
                >
                  Resolve
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="cols"></tr>
            <tr mat-row *matRowDef="let row; columns: cols" class="row"></tr>
          </table>

          <p class="empty" *ngIf="loaded && loadError">Unable to load exceptions right now.</p>
          <p class="empty" *ngIf="loaded && !loadError && !rows.length">No issues found.</p>
        </mat-card-content>
      </mat-card>
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
        width: 220px;
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
      .status {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        border-radius: 999px;
        background: rgba(100, 116, 139, 0.12);
        font-size: 12px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      .status--open {
        background: rgba(237, 108, 2, 0.14);
        color: #c2410c;
      }
      .status--closed {
        background: rgba(46, 125, 50, 0.14);
        color: var(--ss-success);
      }
      .ar {
        text-align: right;
        width: 140px;
        white-space: nowrap;
      }
      .btn-small {
        padding: 0 10px !important;
        min-width: 0 !important;
        height: 30px;
        line-height: 30px;
        font-size: 12px;
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
      .sk {
        padding: 8px 0;
      }
      .sk-row {
        display: grid;
        grid-template-columns: 1fr 1.5fr 0.8fr 0.8fr 1fr 2fr 140px;
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
      .sk--lg {
        width: 80%;
      }
      .sk--md {
        width: 70%;
      }
      .sk--sm {
        width: 55%;
      }
      .sk--xs {
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
