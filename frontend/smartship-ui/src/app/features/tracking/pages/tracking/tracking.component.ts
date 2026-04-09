import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { take } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { TrackingService } from '../../../../core/services/tracking.service';
import { TrackingHistoryDto, TrackingResponseDto } from '../../../../core/models/tracking.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    StatusBadgeComponent,
  ],
  template: `
    <div class="sss-page">
      <h1 class="sss-title">Tracking</h1>
      <p class="sss-sub">Enter a tracking number to see live status and journey history.</p>

      <mat-card class="track-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onTrack()" class="track-form">
            <mat-form-field appearance="outline" class="track-field">
              <mat-label>Tracking number</mat-label>
              <span matPrefix class="field-prefix"><mat-icon>confirmation_number</mat-icon></span>
              <input matInput formControlName="trackingNumber" />
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || loading">
              <mat-icon *ngIf="!loading">search</mat-icon>
              {{ loading ? 'Tracking…' : 'Track' }}
            </button>
          </form>

          <div class="result" *ngIf="tracking">
            <div class="result-head">
              <div>
                <div class="muted">Current status</div>
                <div class="status-line">
                  <app-status-badge [status]="status ?? tracking.currentStatus" />
                </div>
              </div>
              <div class="meta" *ngIf="tracking.trackingNumber">
                <div class="muted">Tracking #</div>
                <div class="mono">{{ tracking.trackingNumber }}</div>
              </div>
            </div>
          </div>

          <div class="timeline" *ngIf="journeyTimeline.length">
            <h2 class="timeline-title">Shipment journey</h2>
            <ol class="timeline-list">
              <li
                *ngFor="let step of journeyTimeline; let last = last"
                class="timeline-item"
                [ngClass]="step.state"
              >
                <div class="timeline-marker">
                  <div class="timeline-icon">
                    <mat-icon>{{ step.icon }}</mat-icon>
                  </div>
                  <div class="timeline-line" *ngIf="!last"></div>
                </div>
                <div class="timeline-body">
                  <div class="timeline-header">
                    <span class="timeline-label">{{ step.label }}</span>
                    <span class="timeline-tag" *ngIf="step.state === 'current'">Current</span>
                    <span class="timeline-tag timeline-tag--done" *ngIf="step.state === 'done'">Completed</span>
                  </div>
                  <p class="timeline-caption" [ngClass]="'timeline-caption--' + step.state">
                    {{ step.caption }}
                  </p>
                  <div class="timeline-meta" *ngIf="step.event">
                    <div class="timeline-meta-main">
                      <span class="meta-when">{{ step.event.timestamp | date : 'short' }}</span>
                      <span class="meta-where" *ngIf="step.event.location">{{ step.event.location }}</span>
                    </div>
                    <p class="meta-remarks" *ngIf="step.event.remarks">{{ step.event.remarks }}</p>
                  </div>
                </div>
              </li>
            </ol>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 900px;
        margin: 0 auto;
      }
      .sss-title {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 600;
      }
      .sss-sub {
        margin: 0 0 18px;
        color: var(--ss-text-muted);
      }
      .track-form {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .track-field {
        flex: 1 1 320px;
      }
      .field-prefix {
        margin-right: 8px;
        display: inline-flex;
        color: rgba(15, 23, 42, 0.45);
      }
      .result {
        margin-top: 18px;
        padding-top: 16px;
        border-top: 1px solid var(--ss-border);
      }
      .result-head {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .muted {
        font-size: 12px;
        color: var(--ss-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.06em;
        font-weight: 700;
        margin-bottom: 6px;
      }
      .status-line {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
      .timeline {
        margin-top: 18px;
      }
      .timeline-title {
        margin: 0 0 10px;
        font-size: 1.05rem;
      }
      .timeline-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      .timeline-item {
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 14px;
        position: relative;
        padding: 10px 0;
      }
      .timeline-marker {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
      }
      .timeline-icon {
        width: 32px;
        height: 32px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: var(--ss-surface-secondary);
        color: var(--ss-text-muted);
        border: 1px solid var(--ss-border);
      }
      .timeline-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .timeline-line {
        flex: 1;
        width: 2px;
        background: linear-gradient(to bottom, var(--ss-border), transparent);
        margin-top: 4px;
      }
      .timeline-body {
        padding-top: 2px;
      }
      .timeline-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
      }
      .timeline-label {
        font-weight: 600;
        font-size: 0.98rem;
      }
      .timeline-tag {
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        padding: 2px 8px;
        border-radius: 999px;
        background: rgba(59, 130, 246, 0.12);
        color: #1d4ed8;
        font-weight: 600;
      }
      .timeline-tag--done {
        background: rgba(34, 197, 94, 0.12);
        color: #15803d;
      }
      .timeline-caption {
        margin: 0 0 4px;
        font-size: 0.9rem;
        color: var(--ss-text-muted);
      }
      .timeline-caption--current {
        color: var(--ss-text);
      }
      .timeline-caption--done {
        color: var(--ss-text-muted);
      }
      .timeline-caption--upcoming {
        font-style: italic;
      }
      .timeline-meta {
        font-size: 0.82rem;
        color: var(--ss-text-muted);
      }
      .timeline-meta-main {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .meta-when {
        font-weight: 500;
      }
      .meta-where {
        opacity: 0.9;
      }
      .meta-remarks {
        margin: 2px 0 0;
      }
      .timeline-item.done .timeline-icon {
        background: var(--ss-primary);
        border-color: var(--ss-primary);
        color: #fff;
      }
      .timeline-item.current .timeline-icon {
        background: var(--ss-primary-dark);
        border-color: var(--ss-primary-dark);
        color: #fff;
        box-shadow: var(--ss-shadow);
      }
      .timeline-item.upcoming .timeline-icon {
        opacity: 0.7;
      }
      @media (max-width: 800px) {
        .track-form {
          flex-direction: column;
        }
        .track-form button {
          width: 100%;
        }
        .timeline-item {
          gap: 10px;
        }
      }
    `,
  ],
})
export class TrackingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackingService);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    trackingNumber: ['', [Validators.required]],
  });

  tracking: TrackingResponseDto | null = null;
  status: string | null = null;
  timeline: TrackingHistoryDto[] = [];
  loading = false;

  constructor() {
    this.route.queryParamMap.pipe(take(1)).subscribe((p) => {
      const tn = (p.get('tn') ?? '').trim();
      if (!tn) return;
      this.form.patchValue({ trackingNumber: tn });
      this.onTrack();
    });
  }

  get sortedTimeline(): TrackingHistoryDto[] {
    return [...this.timeline].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  readonly journeyDefs = [
    {
      key: 'BOOKED',
      label: 'Booked',
      icon: 'assignment_turned_in',
      caption: 'Shipment is created and booking confirmed.',
    },
    {
      key: 'IN_TRANSIT',
      label: 'In Transit',
      icon: 'local_shipping',
      caption: 'Shipment is moving between hubs and facilities.',
    },
    {
      key: 'OUT_FOR_DELIVERY',
      label: 'Out for Delivery',
      icon: 'delivery_dining',
      caption: 'Shipment is with the delivery agent and on the way.',
    },
    {
      key: 'DELIVERED',
      label: 'Delivered',
      icon: 'check_circle',
      caption: 'Shipment has been successfully delivered.',
    },
  ] as const;

  private readonly journeyOrder = ['BOOKED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

  get journeyTimeline():
    | Array<{
        key: string;
        label: string;
        icon: string;
        caption: string;
        state: 'done' | 'current' | 'upcoming';
        event: TrackingHistoryDto | null;
      }>
    | [] {
    if (!this.tracking && !this.timeline.length) {
      return [];
    }

    const currentStage = this.resolveStage(this.status ?? this.tracking?.currentStatus ?? '');
    const currentIndex = this.journeyOrder.indexOf(currentStage);

    const byStage: Record<(typeof this.journeyOrder)[number], TrackingHistoryDto | null> = {
      BOOKED: null,
      IN_TRANSIT: null,
      OUT_FOR_DELIVERY: null,
      DELIVERED: null,
    };

    for (const e of this.sortedTimeline) {
      const stage = this.resolveStage(e.status);
      if (!stage) continue;
      byStage[stage] = e;
    }

    return this.journeyDefs.map((def, index) => {
      const stageKey = def.key as (typeof this.journeyOrder)[number];
      const state: 'done' | 'current' | 'upcoming' =
        currentIndex === -1 || index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming';

      return {
        ...def,
        state,
        event: byStage[stageKey],
      };
    });
  }

  onTrack(): void {
    if (this.form.invalid) return;

    const trackingNumber = this.form.getRawValue().trackingNumber ?? '';
    this.loading = true;
    forkJoin({
      tracking: this.api.getTracking(trackingNumber),
      status: this.api.getStatus(trackingNumber),
      timeline: this.api.getTimeline(trackingNumber),
    })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.tracking = res.tracking;
          this.status = res.status?.status ?? null;
          this.timeline = res.timeline;
        },
      });
  }

  private resolveStage(rawStatus: string | null | undefined): (typeof this.journeyOrder)[number] {
    const status = (rawStatus ?? '').toUpperCase();
    if (!status) return 'BOOKED';

    if (status.includes('DELIVERED') || status.includes('COMPLETED')) {
      return 'DELIVERED';
    }

    if (status.includes('OUT FOR')) {
      return 'OUT_FOR_DELIVERY';
    }

    if (status.includes('TRANSIT') || status.includes('SHIPPED') || status.includes('IN TRANSIT')) {
      return 'IN_TRANSIT';
    }

    if (status.includes('BOOKED') || status.includes('PENDING') || status.includes('CREATED')) {
      return 'BOOKED';
    }

    return 'IN_TRANSIT';
  }
}
