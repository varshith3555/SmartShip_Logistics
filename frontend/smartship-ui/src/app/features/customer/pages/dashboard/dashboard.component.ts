import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

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
  template: `
    <div class="dash-page">

      <!-- ── Greeting ── -->
      <div class="greeting">
        <div>
          <h1 class="greeting-title">Good {{ timeOfDay }}, {{ firstName }}</h1>
          <p class="greeting-sub">Here's a snapshot of your shipments today.</p>
        </div>
        <a class="btn-primary-sm" routerLink="/shipments/create" id="create-shipment-hero-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Shipment
        </a>
      </div>

      <!-- ── Metric Cards ── -->
      <div class="metrics" *ngIf="shipmentsLoaded">

        <div class="metric-card metric-card--neutral">
          <div class="metric-card-inner">
            <div class="mc-icon mc-icon--neutral">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
            </div>
            <div>
              <div class="mc-label">Total Shipments</div>
              <div class="mc-value">{{ metrics.total }}</div>
            </div>
          </div>
          <div class="mc-pill mc-pill--neutral">All time</div>
        </div>

        <div class="metric-card metric-card--info">
          <div class="metric-card-inner">
            <div class="mc-icon mc-icon--info">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </div>
            <div>
              <div class="mc-label">In Transit</div>
              <div class="mc-value">{{ metrics.inTransit }}</div>
            </div>
          </div>
          <div class="mc-pill mc-pill--info">On the way</div>
        </div>

        <div class="metric-card metric-card--success">
          <div class="metric-card-inner">
            <div class="mc-icon mc-icon--success">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div class="mc-label">Delivered</div>
              <div class="mc-value">{{ metrics.delivered }}</div>
            </div>
          </div>
          <div class="mc-pill mc-pill--success">Completed</div>
        </div>

        <div class="metric-card metric-card--warning">
          <div class="metric-card-inner">
            <div class="mc-icon mc-icon--warning">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div>
              <div class="mc-label">Pending / Delayed</div>
              <div class="mc-value">{{ metrics.pendingDelayed }}</div>
            </div>
          </div>
          <div class="mc-pill mc-pill--warning">Needs attention</div>
        </div>

      </div>

      <!-- Metric skeletons while loading -->
      <div class="metrics" *ngIf="!shipmentsLoaded">
        <div class="metric-card sk-card" *ngFor="let _ of [1,2,3,4]">
          <div class="sk-line sk-line--val"></div>
          <div class="sk-line sk-line--label"></div>
        </div>
      </div>

      <!-- ── Track Now Strip ── -->
      <div class="track-strip">
        <div class="track-strip-left">
          <div class="track-strip-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div>
            <div class="track-strip-title">Track a Shipment</div>
            <div class="track-strip-sub">Enter a tracking number for real-time status.</div>
          </div>
        </div>
        <form [formGroup]="trackForm" (ngSubmit)="goTrack()" class="track-strip-form">
          <div class="track-input-wrap">
            <svg class="track-input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>
            <input
              class="track-input"
              type="text"
              formControlName="trackingNumber"
              placeholder="e.g. SS-2024-A1B2C3"
              id="tracking-number-input"
              autocomplete="off"
            />
          </div>
          <button type="submit" class="btn-primary" [disabled]="trackForm.invalid" id="track-now-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            Track Now
          </button>
        </form>
      </div>

      <!-- ── Recent Shipments ── -->
      <div class="section-hd">
        <h2 class="section-title">Recent Shipments</h2>
        <a class="section-link" routerLink="/shipments/my" id="view-all-shipments-link">
          View all
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      </div>

      <div class="surface-card" style="padding: 0; overflow: hidden;">

        <!-- Skeleton rows -->
        <div class="sk-rows" *ngIf="!shipmentsLoaded">
          <div class="sk-row" *ngFor="let _ of [1, 2, 3, 4]">
            <div class="sk-line sk--lg"></div>
            <div class="sk-line sk--sm"></div>
            <div class="sk-line sk--md"></div>
            <div class="sk-line sk--xs"></div>
          </div>
        </div>

        <!-- Table -->
        <table mat-table [dataSource]="recent" class="recent-tbl" *ngIf="shipmentsLoaded && recent.length">
          <ng-container matColumnDef="trackingNumber">
            <th mat-header-cell *matHeaderCellDef>Tracking #</th>
            <td mat-cell *matCellDef="let s"><span class="mono">{{ s.trackingNumber }}</span></td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let s"><app-status-badge [status]="s.status" /></td>
          </ng-container>

          <ng-container matColumnDef="createdAt">
            <th mat-header-cell *matHeaderCellDef>Created</th>
            <td mat-cell *matCellDef="let s">{{ s.createdAt | date : 'mediumDate' }}</td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="col-actions"></th>
            <td mat-cell *matCellDef="let s" class="col-actions">
              <a class="tbl-btn" [routerLink]="['/shipments', s.shipmentId]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                View
              </a>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="recentCols"></tr>
          <tr mat-row *matRowDef="let row; columns: recentCols" class="tbl-row"></tr>
        </table>

        <!-- Empty state -->
        <div class="empty-state" *ngIf="shipmentsLoaded && !recent.length">
          <div class="empty-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <p class="empty-title">No shipments yet</p>
          <p class="empty-sub">Create your first shipment to get started.</p>
          <a class="btn-primary-sm" routerLink="/shipments/create" id="empty-create-btn">Create Shipment</a>
        </div>

      </div>

      <!-- ── Quick Actions ── -->
      <h2 class="section-title" style="margin-top: 32px; margin-bottom: 14px;">Quick Actions</h2>

      <div class="actions-grid">

        <a class="action-card" routerLink="/shipments/create" id="qa-create-btn">
          <div class="ac-icon ac-icon--orange">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </div>
          <div class="ac-body">
            <div class="ac-title">Create Shipment</div>
            <div class="ac-desc">Book a pickup and generate a tracking number</div>
          </div>
          <svg class="ac-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>

        <a class="action-card" routerLink="/shipments/my" id="qa-shipments-btn">
          <div class="ac-icon ac-icon--slate">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
          </div>
          <div class="ac-body">
            <div class="ac-title">My Shipments</div>
            <div class="ac-desc">Review status, history, and shipment details</div>
          </div>
          <svg class="ac-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>

        <a class="action-card" routerLink="/tracking" id="qa-tracking-btn">
          <div class="ac-icon ac-icon--blue">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
          </div>
          <div class="ac-body">
            <div class="ac-title">Tracking</div>
            <div class="ac-desc">Track packages with your tracking number</div>
          </div>
          <svg class="ac-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>

        <a class="action-card" routerLink="/documents" id="qa-documents-btn">
          <div class="ac-icon ac-icon--green">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <div class="ac-body">
            <div class="ac-title">Documents</div>
            <div class="ac-desc">Upload labels, invoices, and customs paperwork</div>
          </div>
          <svg class="ac-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </a>

      </div>
    </div>
  `,
  styles: [`
    /* ─── Page canvas ─── */
    .dash-page {
      min-height: 100vh;
      padding: 32px 28px 64px;
      background:
        radial-gradient(ellipse 600px 400px at -10% -10%, rgba(255, 107, 53, 0.06) 0%, transparent 70%),
        linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }

    /* ─── Shared surface card ─── */
    .surface-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 2px 4px -1px rgba(0, 0, 0, 0.03);
      padding: 24px;
      margin-bottom: 12px;
    }

    /* ─── Greeting ─── */
    .greeting {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .greeting-title {
      font-size: 1.65rem;
      font-weight: 700;
      letter-spacing: -0.03em;
      color: #0F172A;
      margin: 0 0 4px;
      line-height: 1.2;
    }

    .greeting-sub {
      font-size: 14px;
      color: #64748B;
      margin: 0;
    }

    /* ─── Primary button variants ─── */
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 10px 20px;
      border-radius: 9px;
      background: linear-gradient(135deg, #ff6b35 0%, #e85a28 100%);
      border: none;
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.28);
      text-decoration: none;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(255, 107, 53, 0.38);
    }

    .btn-primary:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    .btn-primary-sm {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 8px;
      background: linear-gradient(135deg, #ff6b35 0%, #e85a28 100%);
      border: none;
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      white-space: nowrap;
      text-decoration: none;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(255, 107, 53, 0.25);
    }

    .btn-primary-sm:hover {
      transform: translateY(-1px);
      box-shadow: 0 5px 14px rgba(255, 107, 53, 0.35);
    }

    /* ─── Metric Cards ─── */
    .metrics {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    @media (max-width: 1024px) {
      .metrics { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 560px) {
      .metrics { grid-template-columns: 1fr; }
    }

    .metric-card {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 2px 4px -1px rgba(0, 0, 0, 0.03);
      padding: 20px 20px 16px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      position: relative;
      overflow: hidden;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }

    .metric-card::before {
      content: '';
      position: absolute;
      top: 0; left: 0;
      width: 3px;
      height: 100%;
      border-radius: 0;
    }

    .metric-card--neutral::before { background: #94A3B8; }
    .metric-card--info::before    { background: #3B82F6; }
    .metric-card--success::before { background: #10B981; }
    .metric-card--warning::before { background: #F59E0B; }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 10px 20px -4px rgba(0, 0, 0, 0.08),
        0 4px 8px -2px rgba(0, 0, 0, 0.04);
    }

    .metric-card-inner {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .mc-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .mc-icon--neutral { background: rgba(148,163,184,0.13); color: #475569; }
    .mc-icon--info    { background: rgba(59,130,246,0.1);   color: #2563EB; }
    .mc-icon--success { background: rgba(16,185,129,0.11);  color: #059669; }
    .mc-icon--warning { background: rgba(245,158,11,0.12);  color: #D97706; }

    .mc-label {
      font-size: 11.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #94A3B8;
      margin-bottom: 3px;
    }

    .mc-value {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.04em;
      color: #0F172A;
      line-height: 1;
    }

    .mc-pill {
      align-self: flex-start;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 4px 10px;
      border-radius: 100px;
      font-size: 11.5px;
      font-weight: 600;
    }

    .mc-pill--neutral { background: rgba(148,163,184,0.12); color: #475569; }
    .mc-pill--info    { background: rgba(59,130,246,0.1);   color: #1D4ED8; }
    .mc-pill--success { background: rgba(16,185,129,0.1);   color: #047857; }
    .mc-pill--warning { background: rgba(245,158,11,0.12);  color: #92400E; }

    /* ─── Skeleton cards ─── */
    .sk-card {
      padding: 20px;
      gap: 12px;
    }

    .sk-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.4s ease-in-out infinite;
    }

    .sk-line--val   { width: 45%; height: 20px; }
    .sk-line--label { width: 65%; }

    /* ─── Track Strip ─── */
    .track-strip {
      background: #ffffff;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.05),
        0 2px 4px -1px rgba(0, 0, 0, 0.03);
      padding: 22px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .track-strip-left {
      display: flex;
      align-items: center;
      gap: 16px;
      flex: 1;
      min-width: 200px;
    }

    .track-strip-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #FFF4F0;
      color: #ff6b35;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .track-strip-title {
      font-size: 15px;
      font-weight: 700;
      color: #0F172A;
      letter-spacing: -0.02em;
      margin-bottom: 3px;
    }

    .track-strip-sub {
      font-size: 13px;
      color: #6B7280;
    }

    .track-strip-form {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      min-width: 260px;
      max-width: 460px;
    }

    .track-input-wrap {
      position: relative;
      flex: 1;
    }

    .track-input-icon {
      position: absolute;
      top: 50%;
      left: 13px;
      transform: translateY(-50%);
      color: #9CA3AF;
      pointer-events: none;
    }

    .track-input {
      width: 100%;
      padding: 10px 13px 10px 38px;
      font-size: 14px;
      font-family: inherit;
      color: #111827;
      background: #F9FAFB;
      border: 1.5px solid #E5E7EB;
      border-radius: 9px;
      outline: none;
      transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
      box-sizing: border-box;
    }

    .track-input::placeholder {
      color: #9CA3AF;
      font-size: 13.5px;
    }

    .track-input:hover {
      border-color: #D1D5DB;
    }

    .track-input:focus {
      border-color: #ff6b35;
      background: #fff;
      box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.13);
    }

    /* ─── Section heading ─── */
    .section-hd {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0F172A;
      margin: 0;
    }

    .section-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: #ff6b35;
      text-decoration: none;
      transition: gap 0.15s ease;
    }

    .section-link:hover {
      gap: 7px;
    }

    /* ─── Recent table ─── */
    .recent-tbl {
      width: 100%;
      background: transparent !important;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 13px;
      color: #374151;
    }

    .col-actions {
      text-align: right;
      white-space: nowrap;
      width: 100px;
    }

    .tbl-row {
      transition: background-color 0.15s ease;
    }

    .tbl-row:hover {
      background: #FFF9F7 !important;
    }

    .tbl-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 12px;
      border-radius: 7px;
      border: 1.5px solid #E5E7EB;
      background: #fff;
      color: #374151;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.15s ease;
      cursor: pointer;
    }

    .tbl-btn:hover {
      border-color: #ff6b35;
      color: #ff6b35;
      background: #FFF4F0;
    }

    /* ─── Skeleton rows ─── */
    .sk-rows {
      padding: 8px 0;
    }

    .sk-row {
      display: grid;
      grid-template-columns: 1.4fr 0.9fr 0.9fr 100px;
      gap: 12px;
      align-items: center;
      padding: 14px 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .sk--lg  { width: 80%; }
    .sk--md  { width: 60%; }
    .sk--sm  { width: 50%; }
    .sk--xs  { width: 65%; justify-self: end; }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* ─── Empty state ─── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 44px 24px;
      gap: 8px;
    }

    .empty-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      background: #F3F4F6;
      color: #9CA3AF;
      display: grid;
      place-items: center;
      margin-bottom: 4px;
    }

    .empty-title {
      font-size: 15px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .empty-sub {
      font-size: 13.5px;
      color: #6B7280;
      margin: 0 0 12px;
    }

    /* ─── Quick Action Cards ─── */
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    @media (max-width: 640px) {
      .actions-grid { grid-template-columns: 1fr; }
    }

    .action-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
      box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.04),
        0 2px 4px -1px rgba(0, 0, 0, 0.03);
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .action-card:hover {
      transform: translateY(-2px);
      box-shadow:
        0 12px 24px -5px rgba(0, 0, 0, 0.09),
        0 4px 8px -2px rgba(0, 0, 0, 0.04);
      border-color: #E5E7EB;
    }

    .action-card:hover .ac-chevron {
      color: #ff6b35;
      transform: translateX(3px);
    }

    .ac-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .ac-icon--orange { background: #FFF4F0; color: #ff6b35; }
    .ac-icon--slate  { background: rgba(100,116,139,0.1); color: #475569; }
    .ac-icon--blue   { background: #EFF6FF; color: #3B82F6; }
    .ac-icon--green  { background: #ECFDF5; color: #10B981; }

    .ac-body {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }

    .ac-title {
      font-size: 14.5px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #0F172A;
    }

    .ac-desc {
      font-size: 12.5px;
      color: #6B7280;
      line-height: 1.4;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ac-chevron {
      color: #D1D5DB;
      flex-shrink: 0;
      transition: color 0.2s ease, transform 0.2s ease;
    }

    /* ─── Responsive ─── */
    @media (max-width: 768px) {
      .dash-page { padding: 20px 16px 48px; }
      .track-strip { flex-direction: column; align-items: stretch; }
      .track-strip-form { max-width: 100%; }
      .greeting { align-items: flex-start; }
    }
  `],
})
export class DashboardComponent {
  private readonly auth        = inject(AuthService);
  private readonly fb          = inject(FormBuilder);
  private readonly router      = inject(Router);
  private readonly shipmentsApi = inject(ShipmentService);

  readonly trackForm = this.fb.group({
    trackingNumber: ['', [Validators.required]],
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
