import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ActivatedRoute, Router } from '@angular/router';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Shipment } from '../../../../core/models/shipment.models';

@Component({
  selector: 'app-schedule-pickup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule],
  templateUrl: './schedule-pickup.component.html',
  styleUrls: ['./schedule-pickup.component.scss'],
})
export class SchedulePickupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ShipmentService);
  private readonly notify = inject(NotificationService);

  shipment: Shipment | null = null;
  submitting = false;

  readonly form = this.fb.nonNullable.group({
    scheduledDate: ['', [Validators.required]],
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.api.getShipmentById(id).subscribe({
      next: (s) => {
        this.shipment = s;
        const existing = this.toDatetimeLocalValue(s.pickupDetails?.scheduledDate ?? '');
        if (existing) this.form.controls.scheduledDate.setValue(existing);
      },
    });
  }

  private toDatetimeLocalValue(iso: string): string {
    if (!iso) return '';
    // Convert ISO to yyyy-MM-ddTHH:mm (local)
    const date = new Date(iso);
    if (isNaN(date.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  goBack(): void {
    if (!this.shipment) {
      void this.router.navigate(['/shipments/my']);
      return;
    }
    void this.router.navigate(['/shipments', this.shipment.shipmentId]);
  }

  onSubmit(): void {
    if (!this.shipment || this.form.invalid || this.submitting) return;

    const localValue = this.form.controls.scheduledDate.value;
    const scheduledDate = new Date(localValue).toISOString();

    this.submitting = true;

    const call$ = this.shipment.pickupDetails
      ? this.api.updatePickup(this.shipment.shipmentId, { scheduledDate })
      : this.api.schedulePickup(this.shipment.shipmentId, { scheduledDate });

    call$.subscribe({
      next: () => {
        this.notify.success('Pickup saved successfully!');
        void this.router.navigate(['/shipments', this.shipment!.shipmentId]);
      },
      error: () => {
        this.notify.error('Failed to save pickup. Please try again.');
        this.submitting = false;
      },
      complete: () => {
        this.submitting = false;
      },
    });
  }
}
