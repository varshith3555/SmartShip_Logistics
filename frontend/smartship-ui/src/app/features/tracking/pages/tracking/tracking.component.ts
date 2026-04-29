import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
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
import { trimRequired } from '../../../../shared/validators/trim-required.validator';

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
  templateUrl: './tracking.component.html',
  styleUrls: ['./tracking.component.scss'],
})
export class TrackingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(TrackingService);
  private readonly route = inject(ActivatedRoute);

  readonly form = this.fb.group({
    trackingNumber: ['', [trimRequired]],
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
      key: 'PICKED_UP',
      label: 'Picked Up',
      icon: 'inventory_2',
      caption: 'Shipment has been picked up and is at the origin hub.',
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

  private readonly journeyOrder = ['BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'] as const;

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
      PICKED_UP: null,
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

    const trackingNumber = (this.form.getRawValue().trackingNumber ?? '').trim();
    if (!trackingNumber) return;

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

    // When tracking events haven't been ingested yet, the API may return "Not Found".
    // Never advance the journey for unknown statuses.
    if (status.includes('NOT FOUND') || status.includes('UNKNOWN')) {
      return 'BOOKED';
    }

    if (status.includes('DELIVERED') || status.includes('COMPLETED')) {
      return 'DELIVERED';
    }

    if (status.includes('OUT FOR')) {
      return 'OUT_FOR_DELIVERY';
    }

    if (status.includes('PICKED')) {
      return 'PICKED_UP';
    }

    if (status.includes('TRANSIT') || status.includes('SHIPPED') || status.includes('IN TRANSIT')) {
      return 'IN_TRANSIT';
    }

    if (status.includes('BOOKED') || status.includes('PENDING') || status.includes('CREATED')) {
      return 'BOOKED';
    }

    // Fallback: keep at BOOKED rather than jumping ahead.
    return 'BOOKED';
  }
}
