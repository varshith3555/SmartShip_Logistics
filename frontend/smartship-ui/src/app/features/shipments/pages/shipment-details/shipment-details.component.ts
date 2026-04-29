import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { TrackingService } from '../../../../core/services/tracking.service';
import { TrackingHistoryDto } from '../../../../core/models/tracking.models';
import { DocumentService } from '../../../../core/services/document.service';
import { DeliveryProof } from '../../../../core/models/document.models';
import { SupportService } from '../../../../core/services/support.service';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule, MatButtonModule, StatusBadgeComponent],
  templateUrl: './shipment-details.component.html',
  styleUrls: ['./shipment-details.component.scss'],
})
export class ShipmentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ShipmentService);
  private readonly auth = inject(AuthService);
  private readonly notify = inject(NotificationService);
  private readonly tracking = inject(TrackingService);
  private readonly documents = inject(DocumentService);
  private readonly support = inject(SupportService);

  shipment: Shipment | null = null;
  booking = false;
  reporting = false;
  timeline: TrackingHistoryDto[] = [];
  deliveryProof: DeliveryProof | null = null;
  deliveryProofUnavailable = false;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getShipmentById(id).subscribe({
        next: (s) => {
          this.shipment = s;
          this.loadTimeline(s.trackingNumber);
          this.loadDeliveryProofIfDelivered(s);
        },
      });
    }
  }

  private loadDeliveryProofIfDelivered(s: Shipment): void {
    const status = String(s.status || '').toUpperCase().trim();
    if (status !== 'DELIVERED') {
      this.deliveryProof = null;
      this.deliveryProofUnavailable = false;
      return;
    }

    this.documents.getDeliveryProof(s.shipmentId).subscribe({
      next: (proof) => {
        this.deliveryProof = proof;
        this.deliveryProofUnavailable = false;
      },
      error: () => {
        this.deliveryProof = null;
        this.deliveryProofUnavailable = true;
      },
    });
  }

  private loadTimeline(trackingNumber: string): void {
    if (!trackingNumber) {
      this.timeline = [];
      return;
    }

    this.tracking.getTimeline(trackingNumber).subscribe({
      next: (events) => {
        // Show newest first
        this.timeline = [...(events ?? [])].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
      },
      error: () => {
        this.timeline = [];
      },
    });
  }

  canBook(status: string | null | undefined): boolean {
    const role = (this.auth.role || '').toUpperCase();
    const normalized = String(status || '').toUpperCase().trim();
    return role === 'CUSTOMER' && normalized === 'DRAFT';
  }

  canSchedulePickup(s: Shipment): boolean {
    const role = (this.auth.role || '').toUpperCase();
    const status = String(s.status || '').toUpperCase().trim();
    if (role !== 'CUSTOMER') return false;
    if (status === 'DRAFT') return false;
    if (status === 'DELIVERED' || status === 'CANCELLED' || status === 'FAILED' || status === 'RETURNED') return false;
    return status === 'BOOKED' || !!s.pickupDetails;
  }

  canReportIssue(): boolean {
    const role = (this.auth.role || '').toUpperCase();
    return role === 'CUSTOMER' && !!this.shipment;
  }

  goToPickup(): void {
    if (!this.shipment) return;
    void this.router.navigate(['/shipments', this.shipment.shipmentId, 'pickup']);
  }

  onBook(): void {
    if (!this.shipment || this.booking) return;
    this.booking = true;

    this.api.bookShipment(this.shipment.shipmentId).subscribe({
      next: () => {
        this.notify.success('Shipment booked successfully!');
        this.api.getShipmentById(this.shipment!.shipmentId).subscribe({
          next: (s) => (this.shipment = s),
          complete: () => (this.booking = false),
        });
      },
      error: () => {
        this.notify.error('Failed to book shipment. Please try again.');
        this.booking = false;
      },
    });
  }

  onReportIssue(): void {
    if (!this.shipment || this.reporting) return;

    const message = window.prompt('Describe the issue (optional):') ?? undefined;
    if (message === undefined) return; // user cancelled

    this.reporting = true;
    this.support
      .reportIssue({
        shipmentId: this.shipment.shipmentId,
        message: (message ?? '').trim(),
      })
      .subscribe({
        next: () => {
          this.notify.success('Issue reported. Our team will review it.');
          this.reporting = false;
        },
        error: () => {
          this.notify.error('Failed to report issue. Please try again.');
          this.reporting = false;
        },
      });
  }
}
