import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../../core/services/admin.service';
import { Report } from '../../../../core/models/admin.models';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  template: `
    <div class="sss-page">
      <div class="head">
        <div>
          <h1 class="sss-title">Reports</h1>
          <p class="sss-sub">Performance snapshots — last 7 days.</p>
        </div>
        <button mat-stroked-button color="primary" type="button" (click)="download()" [disabled]="!loaded || !reports.length">
          <mat-icon>download</mat-icon>
          Download report
        </button>
      </div>

      <div class="kpi-grid">
        <mat-card class="kpi">
          <mat-card-content>
            <div class="kpi-label">On-time delivery</div>
            <div class="kpi-value">94.2%</div>
            <div class="kpi-trend kpi-trend--up">
              <mat-icon>trending_up</mat-icon>
              +1.4% vs last week
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi">
          <mat-card-content>
            <div class="kpi-label">Avg. transit time</div>
            <div class="kpi-value">2.6d</div>
            <div class="kpi-trend">
              <mat-icon>schedule</mat-icon>
              Stable
            </div>
          </mat-card-content>
        </mat-card>
        <mat-card class="kpi">
          <mat-card-content>
            <div class="kpi-label">First-attempt success</div>
            <div class="kpi-value">88%</div>
            <div class="kpi-trend kpi-trend--down">
              <mat-icon>trending_down</mat-icon>
              -0.6% vs last week
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="grid-2">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Shipment volume</mat-card-title>
            <mat-card-subtitle>Last 7 days</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="bars" aria-label="Bar chart">
              <div class="bar" *ngFor="let b of barSeries" [style.height.%]="b">
                <span class="bar-tip"></span>
              </div>
            </div>
            <div class="xaxis">
              <span *ngFor="let d of days">{{ d }}</span>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-card-title>SLA trend</mat-card-title>
            <mat-card-subtitle>On-time %</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <svg class="line-svg" viewBox="0 0 420 160" xmlns="http://www.w3.org/2000/svg" aria-label="Line chart">
              <defs>
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="rgba(21,101,192,0.35)" />
                  <stop offset="100%" stop-color="rgba(21,101,192,0.0)" />
                </linearGradient>
              </defs>
              <path [attr.d]="areaPath" fill="url(#g)" />
              <path [attr.d]="linePath" fill="none" stroke="#1565c0" stroke-width="3" stroke-linecap="round" />
              <g *ngFor="let p of linePoints; let i = index">
                <circle [attr.cx]="p.x" [attr.cy]="p.y" r="4" fill="#1565c0" />
              </g>
            </svg>
            <div class="xaxis">
              <span *ngFor="let d of days">{{ d }}</span>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <mat-card class="tbl-card">
        <mat-card-header>
          <mat-card-title>Generated reports</mat-card-title>
          <mat-card-subtitle>From AdminService (read-only)</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="sk" *ngIf="!loaded">
            <div class="sk-row" *ngFor="let _ of [1, 2, 3]">
              <div class="sk-cell sk--lg"></div>
              <div class="sk-cell sk--md"></div>
              <div class="sk-cell sk--sm"></div>
            </div>
          </div>

          <table class="tbl" *ngIf="loaded && reports.length">
            <thead>
              <tr>
                <th>Type</th>
                <th>Generated</th>
                <th class="ar">Preview</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let r of reports">
                <td>{{ r.reportType }}</td>
                <td>{{ r.generatedAt | date : 'medium' }}</td>
                <td class="ar">
                  <span class="pill">JSON</span>
                </td>
              </tr>
            </tbody>
          </table>

          <p class="empty" *ngIf="loaded && !reports.length">No report entries returned.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 1100px;
        margin: 0 auto;
      }
      .head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
        margin-bottom: 14px;
      }
      .sss-title {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 650;
      }
      .sss-sub {
        margin: 0;
        color: var(--ss-text-muted);
      }
      .kpi-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 14px;
      }
      @media (max-width: 900px) {
        .kpi-grid {
          grid-template-columns: 1fr;
        }
      }
      .kpi mat-card-content {
        padding: 16px !important;
      }
      .kpi-label {
        color: var(--ss-text-muted);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
      }
      .kpi-value {
        margin-top: 6px;
        font-size: 2rem;
        font-weight: 800;
        letter-spacing: -0.03em;
      }
      .kpi-trend {
        margin-top: 10px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
      .kpi-trend mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .kpi-trend--up {
        color: var(--ss-success);
      }
      .kpi-trend--down {
        color: var(--ss-error);
      }
      .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-bottom: 14px;
      }
      @media (max-width: 900px) {
        .grid-2 {
          grid-template-columns: 1fr;
        }
      }
      .bars {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        align-items: end;
        height: 140px;
        padding: 8px 4px 0;
      }
      .bar {
        position: relative;
        border-radius: 10px 10px 6px 6px;
        background: linear-gradient(180deg, rgba(21, 101, 192, 0.95), rgba(21, 101, 192, 0.35));
        min-height: 18px;
      }
      .bar-tip {
        position: absolute;
        top: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: #1565c0;
        opacity: 0.9;
      }
      .xaxis {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 10px;
        margin-top: 10px;
        color: var(--ss-text-muted);
        font-size: 12px;
        text-align: center;
      }
      .line-svg {
        width: 100%;
        height: auto;
        display: block;
      }
      .tbl-card mat-card-content {
        overflow: auto;
      }
      .tbl {
        width: 100%;
        border-collapse: collapse;
      }
      .tbl th,
      .tbl td {
        padding: 12px 10px;
        border-bottom: 1px solid var(--ss-border);
        text-align: left;
      }
      .ar {
        text-align: right;
      }
      .pill {
        display: inline-flex;
        padding: 2px 10px;
        border-radius: 999px;
        background: rgba(100, 116, 139, 0.12);
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.06em;
      }
      .empty {
        margin: 0;
        padding: 16px 8px;
        color: var(--ss-text-muted);
        text-align: center;
      }
      .sk {
        padding: 8px 0;
      }
      .sk-row {
        display: grid;
        grid-template-columns: 1.2fr 1fr 120px;
        gap: 12px;
        padding: 14px 8px;
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
        width: 70%;
      }
      .sk--md {
        width: 55%;
      }
      .sk--sm {
        width: 45%;
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
export class ReportsComponent {
  private readonly api = inject(AdminService);

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly barSeries = [42, 58, 46, 70, 62, 38, 55];

  reports: Report[] = [];
  loaded = false;

  readonly linePoints = [
    { x: 30, y: 110 },
    { x: 90, y: 92 },
    { x: 150, y: 84 },
    { x: 210, y: 70 },
    { x: 270, y: 62 },
    { x: 330, y: 54 },
    { x: 390, y: 48 },
  ];

  get linePath(): string {
    const [p0, ...rest] = this.linePoints;
    return `M ${p0.x},${p0.y}` + rest.map((p) => ` L ${p.x},${p.y}`).join('');
  }

  get areaPath(): string {
    const first = this.linePoints[0];
    const last = this.linePoints[this.linePoints.length - 1];
    return `${this.linePath} L ${last.x},140 L ${first.x},140 Z`;
  }

  constructor() {
    this.api.getReports().subscribe({
      next: (r) => {
        this.reports = r;
        this.loaded = true;
      },
      error: () => {
        this.loaded = true;
      },
    });
  }

  download(): void {
    if (!this.loaded || !this.reports.length) return;

    const payload = JSON.stringify(this.reports, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `smartship-reports-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }
}
