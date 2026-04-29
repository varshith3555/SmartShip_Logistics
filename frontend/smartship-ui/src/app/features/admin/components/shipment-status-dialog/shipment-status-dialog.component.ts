import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Hub } from '../../../../core/models/admin.models';

export interface ShipmentStatusDialogData {
  shipmentId: string;
  currentStatus: string;
}

@Component({
  selector: 'app-shipment-status-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './shipment-status-dialog.component.html',
  styleUrls: ['./shipment-status-dialog.component.scss'],
})
export class ShipmentStatusDialogComponent {
  readonly statuses: Array<{ value: string; label: string }> = [
    { value: 'DRAFT', label: 'DRAFT' },
    { value: 'CREATED', label: 'CREATED' },
    { value: 'BOOKED', label: 'BOOKED' },
    { value: 'PICKED_UP', label: 'PICKED UP' },
    { value: 'IN_TRANSIT', label: 'IN TRANSIT' },
    { value: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY' },
    { value: 'DELIVERED', label: 'DELIVERED' },
    { value: 'DELAYED', label: 'DELAYED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
  ];

  private readonly hubRequired = new Set(['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELAYED', 'DELIVERED']);

  hubs: Hub[] = [];

  saving = false;

  private readonly fb = inject(FormBuilder);
  private readonly shipments = inject(ShipmentService);
  private readonly admin = inject(AdminService);
  private readonly notify = inject(NotificationService);
  readonly ref = inject(MatDialogRef<ShipmentStatusDialogComponent, boolean>);
  readonly data = inject<ShipmentStatusDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    status: ['', Validators.required],
    hubId: [''],
    delayedByHours: [0],
    reason: [''],
  });

  constructor() {
    this.form.patchValue({ status: this.toBackendStatus(this.data.currentStatus || 'CREATED') });

    this.admin.getHubs().subscribe({
      next: (h) => (this.hubs = h ?? []),
      error: () => (this.hubs = []),
    });

    this.form.controls.status.valueChanges.subscribe(() => {
      this.syncHubValidators();
    });

    this.syncHubValidators();

    this.form.controls.status.valueChanges.subscribe((v) => {
      if (v === 'DELAYED') {
        this.form.controls.delayedByHours.setValidators([Validators.required, Validators.min(1)]);
        this.form.controls.reason.setValidators([Validators.required, Validators.minLength(3)]);
      } else {
        this.form.controls.delayedByHours.clearValidators();
        this.form.controls.reason.clearValidators();
        this.form.patchValue({ delayedByHours: 0, reason: '' }, { emitEvent: false });
      }
      this.form.controls.delayedByHours.updateValueAndValidity({ emitEvent: false });
      this.form.controls.reason.updateValueAndValidity({ emitEvent: false });
    });
  }

  private syncHubValidators(): void {
    const status = this.form.controls.status.value || '';

    if (this.hubRequired.has(status)) {
      this.form.controls.hubId.setValidators([Validators.required]);
    } else {
      this.form.controls.hubId.clearValidators();
      this.form.controls.hubId.setValue('', { emitEvent: false });
    }

    this.form.controls.hubId.updateValueAndValidity({ emitEvent: false });
  }

  private toBackendStatus(raw: string): string {
    return (raw || '')
      .trim()
      .toUpperCase()
      .replace(/-/g, '_')
      .replace(/\s+/g, '_');
  }

  get isDelayed(): boolean {
    return this.form.controls.status.value === 'DELAYED';
  }

  get requiresHub(): boolean {
    return this.hubRequired.has(this.form.controls.status.value || '');
  }

  get selectedHub(): Hub | null {
    const id = this.form.controls.hubId.value;
    if (!id) return null;
    return this.hubs.find((h) => h.hubId === id) ?? null;
  }

  get isUnchanged(): boolean {
    return this.toBackendStatus(this.data.currentStatus || '') === (this.form.controls.status.value || '');
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const { status, hubId, delayedByHours, reason } = this.form.getRawValue();
    const statusValue = status ?? '';
    const hubIdValue = hubId ? String(hubId) : undefined;

    const afterSuccess = (message: string) => {
      this.notify.success(message);
      this.ref.close(true);
    };

    const afterError = (message: string) => {
      this.notify.error(message);
      this.saving = false;
    };

    // DELAYED is supported as a shipment status, and also creates an Admin exception.
    if (statusValue === 'DELAYED') {
      this.shipments.updateStatus(this.data.shipmentId, { status: statusValue, hubId: hubIdValue }).subscribe({
        next: () => {
          this.admin.delayShipment(this.data.shipmentId, { delayedByHours: Number(delayedByHours), reason: String(reason) }).subscribe({
            next: () => afterSuccess('Shipment delayed'),
            error: () => afterSuccess('Shipment delayed'),
            complete: () => {
              this.saving = false;
            },
          });
        },
        error: () => afterError('Failed to update status'),
        complete: () => {
          // saving is reset in inner observable for delayed path
        },
      });
      return;
    }

    this.shipments.updateStatus(this.data.shipmentId, { status: statusValue, hubId: hubIdValue }).subscribe({
      next: () => afterSuccess('Status updated'),
      error: () => afterError('Failed to update status'),
      complete: () => {
        this.saving = false;
      },
    });
  }
}
