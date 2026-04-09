import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-my-shipments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="ss-page">
      <h1 class="ss-page-title">My Shipments</h1>
      <p class="ss-page-subtitle">Track and open details for your recent shipments.</p>

      <mat-card>
        <mat-card-content class="table-wrap">
          <form [formGroup]="filterForm" class="ship-toolbar" (ngSubmit)="$event.preventDefault()">
            <mat-form-field appearance="outline" class="toolbar-search">
              <mat-label>Search by Tracking ID</mat-label>
              <span matPrefix class="toolbar-prefix"><mat-icon>search</mat-icon></span>
              <input
                matInput
                formControlName="query"
                placeholder="e.g. TRK123456"
                autocomplete="off"
              />
            </mat-form-field>

            <mat-form-field appearance="outline" class="toolbar-status">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option value="">All statuses</mat-option>
                <mat-option *ngFor="let st of statusOptions" [value]="st">{{ st }}</mat-option>
              </mat-select>
            </mat-form-field>
          </form>

          <div class="skeleton" *ngIf="!loaded">
            <div class="sk-row" *ngFor="let _ of [1, 2, 3, 4, 5]">
              <div class="sk-cell sk-cell--lg"></div>
              <div class="sk-cell sk-cell--sm"></div>
              <div class="sk-cell sk-cell--md"></div>
              <div class="sk-cell sk-cell--xs"></div>
            </div>
          </div>

          <table mat-table [dataSource]="shipments" class="ship-table" *ngIf="loaded && shipments.length">
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
              <td mat-cell *matCellDef="let s">{{ s.createdAt | date : 'mediumDate' }}</td>
            </ng-container>

            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="col-actions"></th>
              <td mat-cell *matCellDef="let s" class="col-actions">
                <a mat-stroked-button color="primary" [routerLink]="['/shipments', s.shipmentId]">
                  <mat-icon>visibility</mat-icon>
                  View
                </a>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns" class="data-row"></tr>
          </table>

          <p class="empty" *ngIf="loaded && !shipments.length">No shipments match your filters.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .ship-toolbar {
        display: flex;
        gap: 12px;
        padding: 12px 16px 8px;
        align-items: flex-end;
        flex-wrap: wrap;
      }
      .toolbar-search {
        flex: 1 1 260px;
      }
      .toolbar-status {
        width: 200px;
      }
      .toolbar-prefix {
        margin-right: 8px;
        display: inline-flex;
        color: rgba(15, 23, 42, 0.45);
      }
      .table-wrap {
        padding: 0 !important;
        overflow: auto;
      }
      .ship-table {
        width: 100%;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 0.9rem;
      }
      .col-actions {
        text-align: right;
        width: 140px;
      }
      .data-row:hover {
        background: rgba(21, 101, 192, 0.04);
        box-shadow: 0 1px 0 rgba(15, 23, 42, 0.08);
      }
      .empty {
        padding: 24px 16px;
        margin: 0;
        color: var(--ss-text-muted);
        text-align: center;
      }
      .skeleton {
        padding: 8px 0;
      }
      .sk-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 120px;
        gap: 16px;
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
        width: 70%;
      }
      .sk-cell--md {
        width: 55%;
      }
      .sk-cell--sm {
        width: 45%;
      }
      .sk-cell--xs {
        width: 60%;
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
export class MyShipmentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shipmentsApi = inject(ShipmentService);

  private allShipments: Shipment[] = [];
  shipments: Shipment[] = [];
  displayedColumns = ['trackingNumber', 'status', 'createdAt', 'actions'];
  loaded = false;

  statusOptions: string[] = [];

  readonly filterForm = this.fb.nonNullable.group({
    query: [''],
    status: [''],
  });

  constructor() {
    this.shipmentsApi.getMyShipments().subscribe({
      next: (data) => {
        this.allShipments = data;
        this.buildStatusOptions(data);
        this.applyFilters();
      },
      error: () => {
        this.loaded = true;
      },
      complete: () => {
        this.loaded = true;
      },
    });

    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  private buildStatusOptions(rows: Shipment[]): void {
    const values = new Set<string>();
    for (const s of rows) {
      if (s.status) {
        values.add(s.status);
      }
    }
    this.statusOptions = Array.from(values).sort();
  }

  private applyFilters(): void {
    const raw = this.filterForm.getRawValue();
    const query = (raw.query ?? '').toString().trim().toLowerCase();
    const status = (raw.status ?? '').toString().trim();

    this.shipments = this.allShipments.filter((s) => {
      const tn = (s.trackingNumber ?? '').toLowerCase();
      const matchesQuery = !query || tn.includes(query);
      const matchesStatus = !status || s.status === status;
      return matchesQuery && matchesStatus;
    });
  }
}
