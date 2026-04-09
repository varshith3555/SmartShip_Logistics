import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Hub, Location } from '../../../../core/models/admin.models';
import { AdminService } from '../../../../core/services/admin.service';
import { HubFormDialogComponent } from '../../components/hub-form-dialog/hub-form-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-hubs-locations',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule, MatTooltipModule],
  template: `
    <div class="dash-page">
      <!-- ── Page Header ─────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <p class="page-eyebrow">Logistics Network</p>
          <h1 class="page-title">Hubs & Locations</h1>
          <p class="page-sub">Manage sorting centers and their mapped service locations.</p>
        </div>
        <div class="header-actions">
          <div class="search-box">
            <mat-icon class="search-icon">search</mat-icon>
            <input type="text" placeholder="Search hubs..." class="search-input" [(ngModel)]="searchQuery" />
          </div>
          <button class="primary-btn" type="button" (click)="openHub('create', null)">
            <mat-icon>add</mat-icon>
            Add hub
          </button>
        </div>
      </div>

      <div class="split-layout">
        <!-- ── Hubs Column ───────────────────────────────────────────── -->
        <div class="col">
          <div class="section-header">
            <h2 class="section-title">Sorting Hubs</h2>
            <span class="section-badge" *ngIf="hubsLoaded">{{ filteredHubs.length }} total</span>
          </div>

          <div class="card-list">
            <div class="sk-wrap" *ngIf="!hubsLoaded">
              <div class="sk-card" *ngFor="let _ of [1,2,3,4]"></div>
            </div>

            <div class="data-row" *ngFor="let h of filteredHubs">
              <div class="row-icon row-icon--orange">
                <mat-icon>domain</mat-icon>
              </div>
              <div class="row-info">
                <div class="row-title">{{ h.hubName }}</div>
                <div class="row-sub">{{ formatLocation(h) }}</div>
              </div>
              <div class="row-meta">
                <span class="pill-badge">Capacity: {{ h.capacity }}</span>
              </div>
              <div class="row-actions">
                <button class="icon-btn icon-btn--edit" matTooltip="Edit" (click)="openHub('edit', h)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button class="icon-btn icon-btn--delete" matTooltip="Delete" (click)="deleteHub(h)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>

            <div class="empty-state" *ngIf="hubsLoaded && !filteredHubs.length">
              <mat-icon>domain_disabled</mat-icon>
              <p>No hubs found matching your criteria.</p>
            </div>
          </div>
        </div>

        <!-- ── Locations Column ──────────────────────────────────────── -->
        <div class="col">
          <div class="section-header">
            <h2 class="section-title">Service Locations</h2>
            <span class="section-badge" *ngIf="locsLoaded">{{ locations.length }} total</span>
          </div>

          <div class="card-list">
            <div class="sk-wrap" *ngIf="!locsLoaded">
              <div class="sk-card" *ngFor="let _ of [1,2,3,4,5]"></div>
            </div>

            <div class="data-row" *ngFor="let l of locations">
              <div class="row-icon row-icon--blue">
                <mat-icon>place</mat-icon>
              </div>
              <div class="row-info">
                <div class="row-title">{{ l.city }}, {{ l.state }}</div>
                <div class="row-sub">{{ l.country }} &bull; {{ l.pincode }}</div>
              </div>
              <div class="row-actions">
                <button class="icon-btn icon-btn--delete" matTooltip="Delete" (click)="deleteLocation(l)">
                  <mat-icon>delete_outline</mat-icon>
                </button>
              </div>
            </div>

            <div class="empty-state" *ngIf="locsLoaded && !locations.length">
              <mat-icon>location_off</mat-icon>
              <p>No service locations configured.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      /* ── Page Layout ─────────────────────────────────────────────────── */
      .dash-page {
        max-width: 1340px;
        margin: 0 auto;
        padding: 0 4px 40px;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      }

      /* ── Page Header ─────────────────────────────────────────────────── */
      .page-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 36px;
        padding-bottom: 24px;
        border-bottom: 1px solid var(--ss-border);
      }

      .page-eyebrow {
        margin: 0 0 4px;
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--ss-primary);
      }

      .page-title {
        margin: 0 0 6px;
        font-size: 2.1rem;
        font-weight: 800;
        letter-spacing: -0.04em;
        color: var(--ss-text);
        line-height: 1.1;
      }

      .page-sub {
        margin: 0;
        font-size: 14.5px;
        color: var(--ss-text-muted);
        line-height: 1.5;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      /* ── Search Box ──────────────────────────────────────────────────── */
      .search-box {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-icon {
        position: absolute;
        left: 12px;
        color: #9ca3af;
        font-size: 20px;
        width: 20px;
        height: 20px;
        pointer-events: none;
      }

      .search-input {
        padding: 10px 16px 10px 40px;
        border-radius: 8px;
        border: 1px solid var(--ss-border);
        background: #fff;
        font-size: 14px;
        color: var(--ss-text);
        width: 260px;
        transition: all 0.2s ease;
        outline: none;
        box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      }
      .search-input::placeholder { color: #9ca3af; }
      .search-input:focus {
        border-color: var(--ss-primary);
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.15);
      }

      /* ── Primary Button ──────────────────────────────────────────────── */
      .primary-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        background: var(--ss-primary);
        color: #fff;
        border: none;
        padding: 10px 18px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(255, 107, 53, 0.2);
      }
      .primary-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
      .primary-btn:hover {
        background: var(--ss-primary-dark);
        box-shadow: 0 4px 8px rgba(255, 107, 53, 0.3);
        transform: translateY(-1px);
      }

      /* ── Layout ──────────────────────────────────────────────────────── */
      .split-layout {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 32px;
      }

      @media (max-width: 960px) {
        .split-layout { grid-template-columns: 1fr; }
      }

      /* ── Section Headers ─────────────────────────────────────────────── */
      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }

      .section-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 800;
        letter-spacing: -0.03em;
        color: var(--ss-text);
      }

      .section-badge {
        display: inline-flex;
        align-items: center;
        padding: 2px 10px;
        background: #f3f4f6;
        color: #4b5563;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
      }

      /* ── Data Rows (Modern Cards) ────────────────────────────────────── */
      .card-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .data-row {
        display: flex;
        align-items: center;
        background: #fff;
        border: 1px solid var(--ss-border);
        border-radius: 12px;
        padding: 16px 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        gap: 16px;
      }
      .data-row:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.06);
        border-color: #d1d5db;
      }

      .row-icon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }
      .row-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }

      .row-icon--orange { background: #fff4f0; color: var(--ss-primary); }
      .row-icon--blue   { background: #eff6ff; color: #2563eb; }

      .row-info {
        flex: 1;
        min-width: 0;
      }

      .row-title {
        font-size: 14.5px;
        font-weight: 700;
        color: var(--ss-text);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-sub {
        font-size: 13px;
        color: var(--ss-text-muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .row-meta {
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }

      .pill-badge {
        background: #f3f4f6;
        color: #374151;
        padding: 4px 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        letter-spacing: 0.02em;
        border: 1px solid #e5e7eb;
      }

      /* ── Action Buttons ──────────────────────────────────────────────── */
      .row-actions {
        display: flex;
        align-items: center;
        gap: 4px;
        opacity: 0;
        transform: translateX(10px);
        transition: all 0.2s ease;
      }

      .data-row:hover .row-actions {
        opacity: 1;
        transform: translateX(0);
      }

      .icon-btn {
        width: 34px;
        height: 34px;
        border-radius: 8px;
        border: none;
        background: transparent;
        display: grid;
        place-items: center;
        cursor: pointer;
        transition: all 0.15s ease;
        color: #9ca3af;
      }
      .icon-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }

      .icon-btn--edit:hover { background: #f3f4f6; color: #374151; }
      .icon-btn--delete:hover { background: #fef2f2; color: #dc2626; }

      /* ── Empty State ─────────────────────────────────────────────────── */
      .empty-state {
        padding: 48px 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        background: #fff;
        border: 1px dashed var(--ss-border);
        border-radius: 12px;
        color: #9ca3af;
        text-align: center;
      }
      .empty-state mat-icon { font-size: 40px; width: 40px; height: 40px; }
      .empty-state p { margin: 0; font-size: 14px; font-weight: 500; }

      /* ── Skeleton Loaders ────────────────────────────────────────────── */
      .sk-wrap { display: flex; flex-direction: column; gap: 12px; }

      .sk-card {
        height: 76px;
        border-radius: 12px;
        background: linear-gradient(90deg,#f3f4f6 0%,#e5e7eb 50%,#f3f4f6 100%);
        background-size: 200% 100%;
        animation: shimmer 1.5s ease-in-out infinite;
        border: 1px solid var(--ss-border);
      }

      @keyframes shimmer {
        0%   { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `
  ]
})
export class HubsLocationsComponent {
  private readonly api = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  hubs: Hub[] = [];
  locations: Location[] = [];
  hubsLoaded = false;
  locsLoaded = false;

  searchQuery = '';

  constructor() {
    this.reload();
  }

  get filteredHubs(): Hub[] {
    if (!this.searchQuery) return this.hubs;
    const q = this.searchQuery.toLowerCase();
    return this.hubs.filter(h => 
      h.hubName.toLowerCase().includes(q) || 
      (h.location?.city || '').toLowerCase().includes(q) ||
      (h.location?.state || '').toLowerCase().includes(q)
    );
  }

  reload(): void {
    this.hubsLoaded = false;
    this.locsLoaded = false;

    this.api.getHubs().subscribe({
      next: (h) => {
        this.hubs = h;
        this.hubsLoaded = true;
      },
      error: () => {
        this.hubsLoaded = true;
      },
    });

    this.api.getLocations().subscribe({
      next: (l) => {
        this.locations = l;
        this.locsLoaded = true;
      },
      error: () => {
        this.locsLoaded = true;
      },
    });
  }

  formatLocation(h: Hub): string {
    const l = h.location;
    if (!l) return '—';
    return `${l.city}, ${l.state}`;
  }

  openHub(mode: 'create' | 'edit', hub: Hub | null): void {
    const ref = this.dialog.open(HubFormDialogComponent, {
      width: '520px',
      data: { mode, hub },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.reload();
      }
    });
  }

  deleteHub(h: Hub): void {
    const ok = window.confirm(`Delete hub "${h.hubName}"?`);
    if (!ok) return;
    this.api.deleteHub(h.hubId).subscribe({
      next: () => {
        this.notify.success('Hub deleted');
        this.reload();
      },
      error: () => {
        this.notify.error('Failed to delete hub');
      },
    });
  }

  deleteLocation(l: Location): void {
    const ok = window.confirm(`Delete location ${l.city}, ${l.state} — ${l.pincode}?`);
    if (!ok) return;
    this.api.deleteLocation(l.locationId).subscribe({
      next: () => {
        this.notify.success('Location deleted');
        this.reload();
      },
      error: () => {
        this.notify.error('Failed to delete location');
      },
    });
  }
}
