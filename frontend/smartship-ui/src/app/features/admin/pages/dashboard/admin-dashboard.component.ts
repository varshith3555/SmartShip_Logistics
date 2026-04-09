import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { AdminService } from '../../../../core/services/admin.service';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { ShipmentException } from '../../../../core/models/admin.models';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatTableModule, MatButtonModule, RouterLink, StatusBadgeComponent],
  template: `
    <div class="dash-page">

      <!-- ── Page Header ─────────────────────────────────────────────── -->
      <div class="page-header">
        <div>
          <p class="page-eyebrow">Overview</p>
          <h1 class="page-title">Operations Dashboard</h1>
          <p class="page-sub">Monitor throughput, exceptions, and network health at a glance.</p>
        </div>
        <div class="header-actions">
          <div class="live-indicator">
            <span class="live-dot"></span>
            <span>Live data</span>
          </div>
        </div>
      </div>

      <!-- ── KPI Cards ───────────────────────────────────────────────── -->
      <div class="kpi-grid" *ngIf="shipmentsLoaded">
        <!-- Total Shipments -->
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-icon--orange">
              <mat-icon>inventory_2</mat-icon>
            </div>
            <span class="kpi-trend kpi-trend--up">
              <mat-icon>arrow_upward</mat-icon>12%
            </span>
          </div>
          <div class="kpi-value">{{ stats.total | number }}</div>
          <div class="kpi-label">Total Shipments</div>
          <div class="kpi-footer">vs. last month</div>
        </div>

        <!-- Delivered -->
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-icon--green">
              <mat-icon>task_alt</mat-icon>
            </div>
            <span class="kpi-trend kpi-trend--up">
              <mat-icon>arrow_upward</mat-icon>8%
            </span>
          </div>
          <div class="kpi-value">{{ stats.delivered | number }}</div>
          <div class="kpi-label">Delivered</div>
          <div class="kpi-footer">Successfully completed</div>
        </div>

        <!-- In Transit -->
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-icon--blue">
              <mat-icon>local_shipping</mat-icon>
            </div>
            <span class="kpi-trend kpi-trend--neutral">
              <mat-icon>remove</mat-icon>2%
            </span>
          </div>
          <div class="kpi-value">{{ stats.inTransit | number }}</div>
          <div class="kpi-label">In Transit</div>
          <div class="kpi-footer">Currently en route</div>
        </div>

        <!-- Delayed -->
        <div class="kpi-card">
          <div class="kpi-top">
            <div class="kpi-icon kpi-icon--amber">
              <mat-icon>schedule</mat-icon>
            </div>
            <span class="kpi-trend kpi-trend--down">
              <mat-icon>arrow_downward</mat-icon>5%
            </span>
          </div>
          <div class="kpi-value kpi-value--warn">{{ stats.delayed | number }}</div>
          <div class="kpi-label">Delayed</div>
          <div class="kpi-footer">Requires attention</div>
        </div>
      </div>

      <!-- Skeleton KPIs -->
      <div class="kpi-grid" *ngIf="!shipmentsLoaded">
        <div class="kpi-card kpi-skeleton" *ngFor="let _ of [1,2,3,4]"></div>
      </div>

      <!-- ── Tracking Timeline (Insight strip) ───────────────────────── -->
      <div class="timeline-strip">
        <div class="timeline-step timeline-step--done">
          <div class="tl-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="tl-line"></div>
          <div class="tl-label">Picked Up</div>
        </div>
        <div class="timeline-step timeline-step--done">
          <div class="tl-icon"><mat-icon>warehouse</mat-icon></div>
          <div class="tl-line"></div>
          <div class="tl-label">At Hub</div>
        </div>
        <div class="timeline-step timeline-step--active">
          <div class="tl-icon"><mat-icon>local_shipping</mat-icon></div>
          <div class="tl-line"></div>
          <div class="tl-label">In Transit</div>
        </div>
        <div class="timeline-step">
          <div class="tl-icon"><mat-icon>store</mat-icon></div>
          <div class="tl-line"></div>
          <div class="tl-label">Out for Delivery</div>
        </div>
        <div class="timeline-step">
          <div class="tl-icon"><mat-icon>check_circle</mat-icon></div>
          <div class="tl-line tl-line--none"></div>
          <div class="tl-label">Delivered</div>
        </div>
      </div>

      <!-- ── Shipment Volume: 2-col (Chart 70% + Insights 30%) ────────── -->
      <div class="vol-layout">

        <!-- LEFT: Stacked Bar Chart -->
        <div class="vol-chart-card">
          <div class="vol-header">
            <div>
              <div class="vol-title">Shipment Volume <span class="vol-period">— Last 7 Days</span></div>
              <div class="vol-sub">Stacked daily breakdown: Delivered + Delayed</div>
            </div>
            <div class="vol-legend">
              <span class="vl-item"><span class="vl-dot vl-dot--green"></span>Delivered</span>
              <span class="vl-item"><span class="vl-dot vl-dot--amber"></span>Delayed</span>
            </div>
          </div>

          <!-- Tooltip (shown on hover via JS) -->
          <div class="bar-tooltip" id="barTooltip" style="display:none">
            <div class="bt-day" id="btDay"></div>
            <div class="bt-row"><span class="bt-dot bt-dot--green"></span><span id="btDelivered"></span> delivered</div>
            <div class="bt-row"><span class="bt-dot bt-dot--amber"></span><span id="btDelayed"></span> delayed</div>
          </div>

          <div class="vol-chart-body">
            <!-- Pure SVG stacked bar chart -->
            <svg id="volChart" viewBox="0 0 520 200" class="vol-svg" (mouseleave)="hideBarTooltip()">

              <!-- Y-axis grid lines & ticks -->
              <!-- baseline=160, top=10, range=150, max=50 → each unit = 3px -->
              <line x1="40" y1="10"  x2="520" y2="10"  stroke="#f3f4f6" stroke-width="1"/>
              <line x1="40" y1="60"  x2="520" y2="60"  stroke="#f3f4f6" stroke-width="1"/>
              <line x1="40" y1="110" x2="520" y2="110" stroke="#f3f4f6" stroke-width="1"/>
              <line x1="40" y1="160" x2="520" y2="160" stroke="#f3f4f6" stroke-width="1"/>

              <!-- Y-axis labels -->
              <text x="34" y="14"  class="vc-tick" text-anchor="end">50</text>
              <text x="34" y="64"  class="vc-tick" text-anchor="end">33</text>
              <text x="34" y="114" class="vc-tick" text-anchor="end">17</text>
              <text x="34" y="164" class="vc-tick" text-anchor="end">0</text>

              <!-- ── Day 1: Mon  delivered=32 delayed=5 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Mon',32,5)">
                <rect class="bar bar--delayed bar-ani" x="54"  y="115" width="36" height="15" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="54"  y="19"  width="36" height="96" rx="4" ry="4" style="animation-delay:0.05s"/>
              </g>
              <text x="72"  y="178" class="vc-label" text-anchor="middle">Mon</text>

              <!-- Day 2: Tue  delivered=28 delayed=8 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Tue',28,8)">
                <rect class="bar bar--delayed bar-ani" x="122" y="112" width="36" height="24" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="122" y="28"  width="36" height="84" rx="4" ry="4" style="animation-delay:0.10s"/>
              </g>
              <text x="140" y="178" class="vc-label" text-anchor="middle">Tue</text>

              <!-- Day 3: Wed  delivered=41 delayed=4 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Wed',41,4)">
                <rect class="bar bar--delayed bar-ani" x="190" y="117" width="36" height="12" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="190" y="5"   width="36" height="112" rx="4" ry="4" style="animation-delay:0.15s"/>
              </g>
              <text x="208" y="178" class="vc-label" text-anchor="middle">Wed</text>

              <!-- Day 4: Thu  delivered=36 delayed=9 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Thu',36,9)">
                <rect class="bar bar--delayed bar-ani" x="258" y="133" width="36" height="27" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="258" y="25"  width="36" height="108" rx="4" ry="4" style="animation-delay:0.20s"/>
              </g>
              <text x="276" y="178" class="vc-label" text-anchor="middle">Thu</text>

              <!-- Day 5: Fri  delivered=47 delayed=3 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Fri',47,3)">
                <rect class="bar bar--delayed bar-ani" x="326" y="151" width="36" height="9"  rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="326" y="10"  width="36" height="141" rx="4" ry="4" style="animation-delay:0.25s"/>
              </g>
              <text x="344" y="178" class="vc-label" text-anchor="middle">Fri</text>

              <!-- Day 6: Sat  delivered=22 delayed=11 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Sat',22,11)">
                <rect class="bar bar--delayed bar-ani" x="394" y="127" width="36" height="33" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="394" y="61"  width="36" height="66" rx="4" ry="4" style="animation-delay:0.30s"/>
              </g>
              <text x="412" y="178" class="vc-label" text-anchor="middle">Sat</text>

              <!-- Day 7: Sun  delivered=39 delayed=6 -->
              <g class="bar-group" (mouseenter)="showBarTooltip($event,'Sun',39,6)">
                <rect class="bar bar--delayed bar-ani" x="462" y="113" width="36" height="18" rx="0" ry="0"/>
                <rect class="bar bar--delivered bar-ani" x="462" y="13"  width="36" height="100" rx="4" ry="4" style="animation-delay:0.35s"/>
              </g>
              <text x="480" y="178" class="vc-label" text-anchor="middle">Sun</text>

            </svg>
          </div>
        </div>

        <!-- RIGHT: Weekly Insights Card -->
        <div class="insights-card">
          <div class="ins-header">
            <div class="ins-icon"><mat-icon>insights</mat-icon></div>
            <div>
              <div class="ins-title">Weekly Insights</div>
              <div class="ins-period">Mon – Sun, this week</div>
            </div>
          </div>

          <div class="ins-divider"></div>

          <div class="ins-stat">
            <div class="ins-stat-icon ins-stat-icon--blue"><mat-icon>local_shipping</mat-icon></div>
            <div class="ins-stat-body">
              <div class="ins-stat-value">245</div>
              <div class="ins-stat-label">Total shipments</div>
            </div>
          </div>

          <div class="ins-stat ins-stat--sla">
            <div class="ins-stat-icon ins-stat-icon--green"><mat-icon>verified</mat-icon></div>
            <div class="ins-stat-body">
              <div class="ins-stat-value ins-stat-value--green">87<span class="ins-pct">%</span></div>
              <div class="ins-stat-label">On-time delivery (SLA)</div>
            </div>
            <div class="ins-sla-bar">
              <div class="ins-sla-fill" style="width:87%"></div>
            </div>
          </div>

          <div class="ins-stat">
            <div class="ins-stat-icon ins-stat-icon--amber"><mat-icon>schedule</mat-icon></div>
            <div class="ins-stat-body">
              <div class="ins-stat-value ins-stat-value--amber">Sat</div>
              <div class="ins-stat-label">Most delayed day</div>
            </div>
          </div>

          <div class="ins-divider"></div>

          <div class="ins-stat">
            <div class="ins-stat-icon ins-stat-icon--red"><mat-icon>warning_amber</mat-icon></div>
            <div class="ins-stat-body">
              <div class="ins-stat-value ins-stat-value--red">36</div>
              <div class="ins-stat-label">Total delayed this week</div>
            </div>
          </div>

          <div class="ins-footer">
            <a class="ins-link" routerLink="/admin/reports">
              Full report <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>

      </div>

      <!-- ── Needs Attention ─────────────────────────────────────────── -->
      <div class="section-header">
        <h2 class="section-title">Needs Attention</h2>
        <span class="section-badge" *ngIf="exceptions.length">{{ exceptions.length }} open</span>
      </div>

      <div class="attention-grid">
        <!-- Open Exceptions -->
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title-wrap">
              <div class="data-card-icon data-card-icon--danger">
                <mat-icon>error_outline</mat-icon>
              </div>
              <div>
                <div class="data-card-title">Open Exceptions</div>
                <div class="data-card-sub">Latest items awaiting action</div>
              </div>
            </div>
          </div>

          <div class="sk-wrap" *ngIf="!exceptionsLoaded">
            <div class="sk-row" *ngFor="let _ of [1,2,3]">
              <div class="sk-cell sk--md"></div>
              <div class="sk-cell sk--lg"></div>
              <div class="sk-cell sk--sm"></div>
            </div>
          </div>

          <div class="table-wrap" *ngIf="exceptionsLoaded && exceptions.length">
            <table mat-table [dataSource]="exceptions" class="dash-table">
              <ng-container matColumnDef="shipmentId">
                <th mat-header-cell *matHeaderCellDef>Shipment</th>
                <td mat-cell *matCellDef="let e">
                  <a class="mono-link" [routerLink]="['/shipments', e.shipmentId]">{{ e.shipmentId }}</a>
                </td>
              </ng-container>
              <ng-container matColumnDef="type">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let e"><span class="type-tag">{{ e.type }}</span></td>
              </ng-container>
              <ng-container matColumnDef="createdAt">
                <th mat-header-cell *matHeaderCellDef>Created</th>
                <td mat-cell *matCellDef="let e" class="muted-cell">{{ e.createdAt | date:'mediumDate' }}</td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef class="col-right"></th>
                <td mat-cell *matCellDef="let e" class="col-right">
                  <button class="ghost-btn ghost-btn--primary"
                    type="button"
                    (click)="resolve(e)"
                    [disabled]="isResolved(e) || isResolving(e)">
                    <mat-icon>check</mat-icon>
                    Resolve
                  </button>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="exceptionCols"></tr>
              <tr mat-row *matRowDef="let row; columns: exceptionCols" class="dash-row"></tr>
            </table>
          </div>

          <div class="empty-state" *ngIf="exceptionsLoaded && !exceptions.length">
            <mat-icon>check_circle_outline</mat-icon>
            <p>No open exceptions found</p>
          </div>

          <div class="card-footer" *ngIf="exceptionsLoaded && exceptions.length">
            <a class="footer-link" routerLink="/admin/exceptions">
              View all exceptions <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>

        <!-- Delayed Shipments -->
        <div class="data-card">
          <div class="data-card-header">
            <div class="data-card-title-wrap">
              <div class="data-card-icon data-card-icon--amber">
                <mat-icon>schedule</mat-icon>
              </div>
              <div>
                <div class="data-card-title">Delayed Shipments</div>
                <div class="data-card-sub">Most recent delays</div>
              </div>
            </div>
          </div>

          <div class="sk-wrap" *ngIf="!shipmentsLoaded">
            <div class="sk-row" *ngFor="let _ of [1,2,3]">
              <div class="sk-cell sk--lg"></div>
              <div class="sk-cell sk--sm"></div>
              <div class="sk-cell sk--md"></div>
            </div>
          </div>

          <div class="table-wrap" *ngIf="shipmentsLoaded && delayed.length">
            <table mat-table [dataSource]="delayed" class="dash-table">
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
                <td mat-cell *matCellDef="let s" class="muted-cell">{{ s.createdAt | date:'mediumDate' }}</td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="delayedCols"></tr>
              <tr mat-row *matRowDef="let row; columns: delayedCols" class="dash-row"></tr>
            </table>
          </div>

          <div class="empty-state" *ngIf="shipmentsLoaded && !delayed.length">
            <mat-icon>local_shipping</mat-icon>
            <p>No delayed shipments right now</p>
          </div>

          <div class="card-footer" *ngIf="shipmentsLoaded && delayed.length">
            <a class="footer-link" routerLink="/admin/shipments">
              Manage shipments <mat-icon>arrow_forward</mat-icon>
            </a>
          </div>
        </div>
      </div>

      <!-- ── Quick Links ─────────────────────────────────────────────── -->
      <div class="section-header">
        <h2 class="section-title">Quick Links</h2>
      </div>

      <div class="quicklink-grid">
        <a class="ql-card" routerLink="/admin/shipments">
          <div class="ql-icon ql-icon--orange"><mat-icon>assignment</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Manage Shipments</div>
            <div class="ql-desc">Search, filter, and update shipment status.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>

        <a class="ql-card" routerLink="/admin/hubs-locations">
          <div class="ql-icon ql-icon--blue"><mat-icon>hub</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Hubs &amp; Locations</div>
            <div class="ql-desc">Configure hubs and serviceable locations.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>

        <a class="ql-card" routerLink="/admin/reports">
          <div class="ql-icon ql-icon--green"><mat-icon>insights</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Reports</div>
            <div class="ql-desc">Performance, SLA, and revenue snapshots.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>

        <a class="ql-card" routerLink="/admin/users">
          <div class="ql-icon ql-icon--purple"><mat-icon>group</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Users</div>
            <div class="ql-desc">Browse user accounts and roles.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>

        <a class="ql-card" routerLink="/admin/exceptions">
          <div class="ql-icon ql-icon--red"><mat-icon>error_outline</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Exceptions</div>
            <div class="ql-desc">Review open exceptions awaiting action.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>

        <a class="ql-card" routerLink="/admin/documents">
          <div class="ql-icon ql-icon--teal"><mat-icon>description</mat-icon></div>
          <div class="ql-body">
            <div class="ql-title">Documents</div>
            <div class="ql-desc">Upload and fetch shipment documents.</div>
          </div>
          <mat-icon class="ql-chev">chevron_right</mat-icon>
        </a>
      </div>

      <!-- ── Recent Shipments ────────────────────────────────────────── -->
      <div class="section-header">
        <h2 class="section-title">Recent Shipments</h2>
      </div>

      <div class="data-card data-card--full">
        <div class="sk-wrap" *ngIf="!shipmentsLoaded">
          <div class="sk-row sk-row--5" *ngFor="let _ of [1,2,3,4,5]">
            <div class="sk-cell sk--md"></div>
            <div class="sk-cell sk--lg"></div>
            <div class="sk-cell sk--sm"></div>
            <div class="sk-cell sk--md"></div>
            <div class="sk-cell sk--sm" style="justify-self:end"></div>
          </div>
        </div>

        <div class="table-wrap" *ngIf="shipmentsLoaded && recent.length">
          <table mat-table [dataSource]="recent" class="dash-table">
            <ng-container matColumnDef="shipmentId">
              <th mat-header-cell *matHeaderCellDef>Shipment ID</th>
              <td mat-cell *matCellDef="let s"><span class="mono">{{ s.shipmentId }}</span></td>
            </ng-container>
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
              <td mat-cell *matCellDef="let s" class="muted-cell">{{ s.createdAt | date:'medium' }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef class="col-right"></th>
              <td mat-cell *matCellDef="let s" class="col-right">
                <a class="ghost-btn ghost-btn--secondary" [routerLink]="['/shipments', s.shipmentId]">
                  <mat-icon>visibility</mat-icon>
                  View
                </a>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="recentCols"></tr>
            <tr mat-row *matRowDef="let row; columns: recentCols" class="dash-row"></tr>
          </table>
        </div>

        <div class="empty-state" *ngIf="shipmentsLoaded && !recent.length">
          <mat-icon>inbox</mat-icon>
          <p>No shipments found</p>
        </div>
      </div>

    </div>
  `,
  styles: [`
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
      gap: 12px;
    }

    .live-indicator {
      display: flex;
      align-items: center;
      gap: 7px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 999px;
      padding: 5px 14px;
      font-size: 12.5px;
      font-weight: 600;
      color: #166534;
    }

    .live-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #22c55e;
      box-shadow: 0 0 0 3px rgba(34,197,94,0.25);
      animation: pulse-dot 1.8s ease-in-out infinite;
    }

    @keyframes pulse-dot {
      0%, 100% { box-shadow: 0 0 0 3px rgba(34,197,94,0.25); }
      50% { box-shadow: 0 0 0 6px rgba(34,197,94,0.12); }
    }

    /* ── KPI Cards ───────────────────────────────────────────────────── */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }

    @media (max-width: 1100px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px)  { .kpi-grid { grid-template-columns: 1fr; } }

    .kpi-card {
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      padding: 24px 24px 20px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.06), 0 0 0 0 transparent;
      transition: box-shadow 0.22s ease, transform 0.22s ease;
      cursor: default;
      position: relative;
      overflow: hidden;
    }

    .kpi-card::after {
      content: '';
      position: absolute;
      inset: 0;
      border-radius: 14px;
      opacity: 0;
      transition: opacity 0.22s ease;
      background: linear-gradient(135deg, rgba(255,107,53,0.03) 0%, transparent 60%);
    }

    .kpi-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.09), 0 2px 8px rgba(0,0,0,0.06);
    }
    .kpi-card:hover::after { opacity: 1; }

    .kpi-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .kpi-icon {
      width: 46px;
      height: 46px;
      border-radius: 11px;
      display: grid;
      place-items: center;
    }
    .kpi-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .kpi-icon--orange { background: linear-gradient(135deg,#fff4f0,#ffe8dd); color: var(--ss-primary); }
    .kpi-icon--green  { background: linear-gradient(135deg,#d1fae5,#a7f3d0); color: #047857; }
    .kpi-icon--blue   { background: linear-gradient(135deg,#dbeafe,#bfdbfe); color: #1d4ed8; }
    .kpi-icon--amber  { background: linear-gradient(135deg,#fef3c7,#fde68a); color: #d97706; }

    .kpi-trend {
      display: inline-flex;
      align-items: center;
      gap: 2px;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 9px;
      border-radius: 999px;
    }
    .kpi-trend mat-icon { font-size: 14px; width: 14px; height: 14px; }

    .kpi-trend--up      { background: #d1fae5; color: #047857; }
    .kpi-trend--down    { background: #fee2e2; color: #b91c1c; }
    .kpi-trend--neutral { background: #f3f4f6; color: #6b7280; }

    .kpi-value {
      font-size: 3rem;
      font-weight: 900;
      letter-spacing: -0.05em;
      color: var(--ss-text);
      line-height: 1;
      margin-bottom: 6px;
    }
    .kpi-value--warn { color: #d97706; }

    .kpi-label {
      font-size: 13px;
      font-weight: 700;
      color: var(--ss-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 4px;
    }

    .kpi-footer {
      font-size: 12.5px;
      color: #9ca3af;
    }

    /* KPI Skeleton */
    .kpi-skeleton {
      height: 178px;
      background: linear-gradient(90deg,#f3f4f6 0%,#e9ebee 50%,#f3f4f6 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    /* ── Tracking Timeline Strip ─────────────────────────────────────── */
    .timeline-strip {
      display: flex;
      align-items: flex-start;
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      padding: 22px 28px;
      margin-bottom: 24px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      overflow-x: auto;
    }

    .timeline-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      position: relative;
    }

    .tl-icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #f3f4f6;
      border: 2px solid #e5e7eb;
      color: #9ca3af;
      transition: all 0.2s ease;
      z-index: 1;
    }
    .tl-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .tl-line {
      position: absolute;
      top: 22px;
      left: calc(50% + 22px);
      right: calc(-50% + 22px);
      height: 2px;
      background: #e5e7eb;
    }
    .tl-line--none { display: none; }

    .tl-label {
      margin-top: 10px;
      font-size: 11.5px;
      font-weight: 600;
      color: #9ca3af;
      text-align: center;
      white-space: nowrap;
    }

    .timeline-step--done .tl-icon {
      background: linear-gradient(135deg,#d1fae5,#a7f3d0);
      border-color: #6ee7b7;
      color: #047857;
    }
    .timeline-step--done .tl-line { background: #6ee7b7; }
    .timeline-step--done .tl-label { color: #047857; }

    .timeline-step--active .tl-icon {
      background: linear-gradient(135deg,var(--ss-primary),var(--ss-primary-dark));
      border-color: var(--ss-primary);
      color: #fff;
      box-shadow: 0 4px 14px rgba(255,107,53,0.35);
    }
    .timeline-step--active .tl-label {
      color: var(--ss-primary-dark);
      font-weight: 700;
    }

    /* ═══════════════════════════════════════════════════════════════
       Shipment Volume — 2-column layout
    ════════════════════════════════════════════════════════════════ */
    .vol-layout {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 20px;
      margin-bottom: 36px;
      align-items: stretch;
    }

    @media (max-width: 1100px) {
      .vol-layout { grid-template-columns: 1fr; }
    }

    /* ── Bar Chart Card (left) ─────────────────────────────────────── */
    .vol-chart-card {
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      padding: 22px 24px 16px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      position: relative;
      overflow: visible;
    }

    .vol-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 18px;
    }

    .vol-title {
      font-size: 14.5px;
      font-weight: 700;
      color: var(--ss-text);
    }

    .vol-period {
      color: var(--ss-text-muted);
      font-weight: 500;
    }

    .vol-sub {
      font-size: 12px;
      color: var(--ss-text-muted);
      margin-top: 2px;
    }

    /* Legend */
    .vol-legend {
      display: flex;
      gap: 16px;
    }

    .vl-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--ss-text-muted);
    }

    .vl-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .vl-dot--green { background: #22c55e; }
    .vl-dot--amber { background: #f59e0b; }

    /* ── The SVG chart ─────────────────────────────────────────────── */
    .vol-chart-body {
      width: 100%;
    }

    .vol-svg {
      width: 100%;
      height: 200px;
      overflow: visible;
    }

    .vc-tick {
      font-size: 9.5px;
      fill: #c4c9d4;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
    }

    .vc-label {
      font-size: 10.5px;
      fill: #9ca3af;
      font-family: 'Inter', sans-serif;
      font-weight: 600;
    }

    /* Bars */
    .bar { transition: opacity 0.15s ease; cursor: pointer; }
    .bar--delivered { fill: #22c55e; }
    .bar--delayed   { fill: #fbbf24; }

    .bar-group:hover .bar--delivered { fill: #16a34a; }
    .bar-group:hover .bar--delayed   { fill: #d97706; }

    /* Animate bars growing from bottom */
    @keyframes bar-grow {
      from { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
      to   { transform: scaleY(1); transform-origin: bottom; opacity: 1; }
    }
    .bar-ani {
      animation: bar-grow 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    /* ── Hover Tooltip ─────────────────────────────────────────────── */
    .bar-tooltip {
      position: absolute;
      background: #1e2535;
      border-radius: 8px;
      padding: 9px 13px;
      pointer-events: none;
      z-index: 50;
      min-width: 130px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
    }

    .bt-day {
      font-size: 11px;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 6px;
    }

    .bt-row {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 12.5px;
      font-weight: 600;
      color: #f1f5f9;
      margin-top: 3px;
    }

    .bt-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .bt-dot--green { background: #4ade80; }
    .bt-dot--amber { background: #fbbf24; }

    /* ═══════════════════════════════════════════════════════════════
       Weekly Insights Card (right)
    ════════════════════════════════════════════════════════════════ */
    .insights-card {
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      padding: 20px 22px;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .ins-header {
      display: flex;
      align-items: center;
      gap: 11px;
      margin-bottom: 16px;
    }

    .ins-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: #eff6ff;
      display: grid;
      place-items: center;
      color: #2563eb;
      flex-shrink: 0;
    }
    .ins-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .ins-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--ss-text);
    }

    .ins-period {
      font-size: 11.5px;
      color: var(--ss-text-muted);
      margin-top: 1px;
    }

    .ins-divider {
      height: 1px;
      background: #f3f4f6;
      margin: 12px 0;
    }

    .ins-stat {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 0;
    }

    .ins-stat-icon {
      width: 34px;
      height: 34px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .ins-stat-icon mat-icon { font-size: 18px; width: 18px; height: 18px; }

    .ins-stat-icon--blue  { background: #eff6ff; color: #2563eb; }
    .ins-stat-icon--green { background: #f0fdf4; color: #16a34a; }
    .ins-stat-icon--amber { background: #fefce8; color: #d97706; }
    .ins-stat-icon--red   { background: #fef2f2; color: #dc2626; }

    .ins-stat-body {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    /* SLA bar spans below — needs a wrapper trick */
    .ins-stat--sla {
      flex-wrap: wrap;
    }
    .ins-stat--sla .ins-sla-bar {
      width: 100%;
      margin-left: 46px; /* icon(34) + gap(12) */
      margin-top: 6px;
    }

    .ins-stat-value {
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      color: var(--ss-text);
      line-height: 1;
    }
    .ins-stat-value--green { color: #16a34a; }
    .ins-stat-value--amber { color: #d97706; }
    .ins-stat-value--red   { color: #dc2626; }

    .ins-pct {
      font-size: 1rem;
      font-weight: 700;
      letter-spacing: 0;
    }

    .ins-stat-label {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--ss-text-muted);
      line-height: 1.3;
      margin-left: 4px;
    }

    /* SLA progress bar */
    .ins-sla-bar {
      width: 100%;
      height: 5px;
      background: #f3f4f6;
      border-radius: 999px;
      overflow: hidden;
      margin-top: 6px;
    }

    .ins-sla-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #16a34a);
      border-radius: 999px;
      transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .ins-footer {
      margin-top: auto;
      padding-top: 14px;
    }

    .ins-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ss-primary);
      text-decoration: none;
      transition: color 0.15s;
    }
    .ins-link mat-icon { font-size: 15px; width: 15px; height: 15px; }
    .ins-link:hover { color: var(--ss-primary-dark); }

    /* ── Section Headers ─────────────────────────────────────────────── */
    .section-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 16px;
    }

    .section-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--ss-text);
    }

    .section-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 9px;
      background: #fee2e2;
      color: #b91c1c;
      border-radius: 999px;
      font-size: 11.5px;
      font-weight: 700;
    }

    /* ── Data Cards ──────────────────────────────────────────────────── */
    .attention-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 20px;
      margin-bottom: 36px;
    }

    @media (max-width: 960px) { .attention-grid { grid-template-columns: 1fr; } }

    .data-card {
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }

    .data-card--full {
      margin-bottom: 0;
    }

    .data-card-header {
      padding: 20px 22px 16px;
      border-bottom: 1px solid var(--ss-border);
    }

    .data-card-title-wrap {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .data-card-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }
    .data-card-icon mat-icon { font-size: 20px; width: 20px; height: 20px; }

    .data-card-icon--danger { background: #fee2e2; color: #b91c1c; }
    .data-card-icon--amber  { background: #fef3c7; color: #d97706; }

    .data-card-title {
      font-size: 14.5px;
      font-weight: 700;
      color: var(--ss-text);
    }

    .data-card-sub {
      font-size: 12.5px;
      color: var(--ss-text-muted);
    }

    /* ── Tables ──────────────────────────────────────────────────────── */
    .table-wrap {
      overflow-x: auto;
    }

    .dash-table {
      width: 100%;
      background: transparent !important;
    }

    .dash-table th.mat-mdc-header-cell {
      background: #fafafa !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.07em !important;
      color: #9ca3af !important;
      padding: 14px 20px !important;
      border-bottom: 1px solid #f0f0f0 !important;
    }

    .dash-table td.mat-mdc-cell {
      padding: 18px 20px !important;
      font-size: 13.5px !important;
      border-bottom: 1px solid #f7f7f7 !important;
      color: var(--ss-text-secondary) !important;
    }

    .dash-row {
      transition: background 0.13s ease;
    }

    .dash-row:hover td {
      background: #fafbff !important;
    }

    .dash-row:last-child td {
      border-bottom: none !important;
    }

    .mono {
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
      font-size: 12.5px;
      color: var(--ss-text-secondary);
      font-weight: 500;
    }

    .mono-link {
      font-family: ui-monospace, 'SF Mono', 'Cascadia Code', monospace;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--ss-primary);
      text-decoration: none;
      transition: color 0.15s;
    }
    .mono-link:hover { color: var(--ss-primary-dark); text-decoration: underline; }

    .muted-cell { color: #9ca3af !important; }

    .type-tag {
      display: inline-block;
      padding: 2px 9px;
      background: #f3f4f6;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #4b5563;
    }

    /* ── Ghost Buttons ───────────────────────────────────────────────── */
    .col-right { text-align: right !important; white-space: nowrap; width: 120px; }

    .ghost-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid transparent;
      background: transparent;
      transition: all 0.15s ease;
      text-decoration: none;
    }

    .ghost-btn mat-icon { font-size: 15px; width: 15px; height: 15px; }

    .ghost-btn--primary {
      border-color: var(--ss-primary);
      color: var(--ss-primary);
    }
    .ghost-btn--primary:hover:not([disabled]) {
      background: var(--ss-primary-light);
    }
    .ghost-btn--primary[disabled] {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .ghost-btn--secondary {
      border-color: var(--ss-border);
      color: var(--ss-text-secondary);
    }
    .ghost-btn--secondary:hover {
      border-color: var(--ss-text-muted);
      background: #f9fafb;
    }

    /* ── Card Footer ─────────────────────────────────────────────────── */
    .card-footer {
      padding: 14px 20px;
      border-top: 1px solid #f0f0f0;
      display: flex;
      justify-content: flex-end;
    }

    .footer-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      font-weight: 600;
      color: var(--ss-primary);
      text-decoration: none;
      transition: color 0.15s;
    }
    .footer-link mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .footer-link:hover { color: var(--ss-primary-dark); }

    /* ── Empty State ─────────────────────────────────────────────────── */
    .empty-state {
      padding: 44px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: #9ca3af;
    }
    .empty-state mat-icon { font-size: 36px; width: 36px; height: 36px; }
    .empty-state p { margin: 0; font-size: 14px; font-weight: 500; }

    /* ── Quick Links ─────────────────────────────────────────────────── */
    .quicklink-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
      margin-bottom: 36px;
    }

    @media (max-width: 960px) { .quicklink-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 580px) { .quicklink-grid { grid-template-columns: 1fr; } }

    .ql-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 18px 20px;
      background: #fff;
      border: 1px solid var(--ss-border);
      border-radius: 12px;
      text-decoration: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      cursor: pointer;
    }

    .ql-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0,0,0,0.08);
      border-color: var(--ss-primary);
    }

    .ql-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      transition: all 0.2s ease;
    }
    .ql-icon mat-icon { font-size: 22px; width: 22px; height: 22px; }

    .ql-icon--orange { background: #fff4f0; color: var(--ss-primary); }
    .ql-icon--blue   { background: #eff6ff; color: #2563eb; }
    .ql-icon--green  { background: #f0fdf4; color: #16a34a; }
    .ql-icon--purple { background: #f5f3ff; color: #7c3aed; }
    .ql-icon--red    { background: #fef2f2; color: #dc2626; }
    .ql-icon--teal   { background: #f0fdfa; color: #0d9488; }

    .ql-card:hover .ql-icon { background: var(--ss-primary-light); color: var(--ss-primary); }

    .ql-body { flex: 1; min-width: 0; }

    .ql-title {
      font-size: 14px;
      font-weight: 700;
      color: var(--ss-text);
      margin-bottom: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .ql-desc {
      font-size: 12px;
      color: var(--ss-text-muted);
      line-height: 1.4;
    }

    .ql-chev {
      color: #d1d5db;
      font-size: 20px;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }
    .ql-card:hover .ql-chev { color: var(--ss-primary); transform: translateX(3px); }

    /* ── Skeleton Loaders ────────────────────────────────────────────── */
    .sk-wrap { padding: 0; }

    .sk-row {
      display: grid;
      gap: 16px;
      align-items: center;
      padding: 18px 20px;
      border-bottom: 1px solid #f7f7f7;
      grid-template-columns: 1.2fr 1.6fr 0.8fr;
    }

    .sk-row--5 { grid-template-columns: 1.2fr 1.2fr 0.8fr 1.1fr 120px; }

    .sk-cell {
      height: 13px;
      border-radius: 6px;
      background: linear-gradient(90deg,#f0f0f0 0%,#e4e4e4 50%,#f0f0f0 100%);
      background-size: 200% 100%;
      animation: shimmer 1.5s ease-in-out infinite;
    }

    .sk--lg  { width: 85%; }
    .sk--md  { width: 65%; }
    .sk--sm  { width: 48%; }

    @keyframes shimmer {
      0%   { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `],
})
export class AdminDashboardComponent {
  private readonly adminApi    = inject(AdminService);
  private readonly shipmentsApi = inject(ShipmentService);
  private readonly notify      = inject(NotificationService);
  private readonly _elRef      = inject(ElementRef);

  private readonly resolving = new Set<string>();

  shipmentsLoaded = false;
  exceptionsLoaded = false;

  stats = { total: 0, delivered: 0, inTransit: 0, delayed: 0 };

  exceptions: ShipmentException[] = [];
  delayed: Shipment[] = [];
  recent: Shipment[] = [];

  readonly exceptionCols = ['shipmentId', 'type', 'createdAt', 'actions'];
  readonly delayedCols = ['trackingNumber', 'status', 'createdAt'];
  readonly recentCols = ['shipmentId', 'trackingNumber', 'status', 'createdAt', 'actions'];

  constructor() {
    this.shipmentsApi.getAllShipments().subscribe({
      next: (rows: Shipment[]) => {
        this.stats = this.compute(rows);
        this.delayed = this.computeDelayed(rows);
        this.recent = this.computeRecent(rows);
        this.shipmentsLoaded = true;
      },
      error: () => {
        this.shipmentsLoaded = true;
      },
    });

    this.reloadExceptions();
  }

  isResolved(e: ShipmentException): boolean {
    const v = (e.status ?? '').toUpperCase();
    return v.includes('RESOLV') || v.includes('CLOSE');
  }

  isResolving(e: ShipmentException): boolean {
    return this.resolving.has(e.exceptionId);
  }

  resolve(e: ShipmentException): void {
    if (this.isResolved(e) || this.isResolving(e)) return;
    this.resolving.add(e.exceptionId);
    this.adminApi.resolveShipment(e.shipmentId, { resolutionDetails: 'Resolved' }).subscribe({
      next: () => {
        this.reloadExceptions();
        this.notify.success('Exception resolved');
        this.resolving.delete(e.exceptionId);
      },
      error: () => {
        this.notify.error('Failed to resolve exception');
        this.resolving.delete(e.exceptionId);
      },
    });
  }

  private reloadExceptions(): void {
    this.exceptionsLoaded = false;
    this.adminApi.getExceptions().subscribe({
      next: (rows) => {
        const sorted = [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.exceptions = sorted.slice(0, 3);
        this.exceptionsLoaded = true;
      },
      error: () => {
        this.exceptionsLoaded = true;
      },
    });
  }

  private compute(rows: Shipment[]): { total: number; delivered: number; inTransit: number; delayed: number } {
    const norm = (s: string) => s.toUpperCase().replace(/-/g, ' ').trim();
    let delivered = 0;
    let inTransit = 0;
    let delayed = 0;
    for (const s of rows) {
      const v = norm(s.status);
      if (v.includes('DELIVER')) delivered++;
      else if (v.includes('DELAY')) delayed++;
      else if (v.includes('TRANSIT') || v.includes('PICKUP') || v.includes('OUT FOR')) inTransit++;
    }
    return { total: rows.length, delivered, inTransit, delayed };
  }

  private computeRecent(rows: Shipment[]): Shipment[] {
    return [...rows]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }

  private computeDelayed(rows: Shipment[]): Shipment[] {
    const norm = (s: string) => s.toUpperCase().replace(/-/g, ' ').trim();
    return rows
      .filter((s) => norm(s.status).includes('DELAY'))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }

  // ── Bar chart tooltip ─────────────────────────────────────────────
  showBarTooltip(event: MouseEvent, day: string, delivered: number, delayed: number): void {
    const host = (event.currentTarget as SVGElement).closest('.vol-chart-card') as HTMLElement | null;
    if (!host) return;
    const tip = host.querySelector('#barTooltip') as HTMLElement | null;
    if (!tip) return;

    const dayEl  = host.querySelector('#btDay')       as HTMLElement | null;
    const delEl  = host.querySelector('#btDelivered') as HTMLElement | null;
    const dlyEl  = host.querySelector('#btDelayed')   as HTMLElement | null;
    if (dayEl)  dayEl.textContent  = day;
    if (delEl)  delEl.textContent  = String(delivered);
    if (dlyEl)  dlyEl.textContent  = String(delayed);

    const hostRect = host.getBoundingClientRect();
    const svgEl   = host.querySelector('.vol-svg') as SVGSVGElement | null;
    const target  = event.currentTarget as SVGElement;
    const barRect = target.getBoundingClientRect();

    const left = barRect.left - hostRect.left + barRect.width / 2 - 65;
    const top  = barRect.top  - hostRect.top  - 90;

    tip.style.display = 'block';
    tip.style.left    = `${Math.max(0, left)}px`;
    tip.style.top     = `${Math.max(0, top)}px`;
  }

  hideBarTooltip(): void {
    // Find any open tooltip inside this component's host element
    const tip = this._elRef.nativeElement.querySelector('#barTooltip') as HTMLElement | null;
    if (tip) tip.style.display = 'none';
  }
}
