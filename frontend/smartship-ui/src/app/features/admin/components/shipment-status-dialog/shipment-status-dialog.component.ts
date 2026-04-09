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
  template: `
    <h2 mat-dialog-title>Update status</h2>
    <form mat-dialog-content [formGroup]="form" (ngSubmit)="save()">
      <p class="hint">Shipment <span class="mono">{{ data.shipmentId }}</span></p>
      <mat-form-field appearance="outline" class="full">
        <mat-label>Status</mat-label>
        <mat-select formControlName="status">
          <mat-option *ngFor="let s of statuses" [value]="s.value" [disabled]="s.value === 'CREATED'">{{ s.label }}</mat-option>
        </mat-select>
      </mat-form-field>

      <div *ngIf="isDelayed" class="delay">
        <mat-form-field appearance="outline" class="full">
          <mat-label>Delayed by (hours)</mat-label>
          <input matInput type="number" formControlName="delayedByHours" min="1" step="1" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full">
          <mat-label>Reason</mat-label>
          <input matInput type="text" formControlName="reason" />
        </mat-form-field>
      </div>
    </form>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close()">Cancel</button>
      <button
        mat-flat-button
        color="primary"
        type="button"
        (click)="save()"
        [disabled]="form.invalid || saving || isUnchanged"
      >
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  `,
  styles: [
    `
      .full {
        width: 100%;
      }
      .delay {
        margin-top: 10px;
      }
      .hint {
        margin: 0 0 12px;
        color: var(--ss-text-muted);
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
    `,
  ],
})
export class ShipmentStatusDialogComponent {
  readonly statuses: Array<{ value: string; label: string }> = [
    { value: 'CREATED', label: 'CREATED' },
    { value: 'BOOKED', label: 'BOOKED' },
    { value: 'IN_TRANSIT', label: 'IN TRANSIT' },
    { value: 'OUT_FOR_DELIVERY', label: 'OUT FOR DELIVERY' },
    { value: 'DELIVERED', label: 'DELIVERED' },
    { value: 'DELAYED', label: 'DELAYED' },
    { value: 'CANCELLED', label: 'CANCELLED' },
  ];

  saving = false;

  private readonly fb = inject(FormBuilder);
  private readonly shipments = inject(ShipmentService);
  private readonly admin = inject(AdminService);
  private readonly notify = inject(NotificationService);
  readonly ref = inject(MatDialogRef<ShipmentStatusDialogComponent, boolean>);
  readonly data = inject<ShipmentStatusDialogData>(MAT_DIALOG_DATA);

  readonly form = this.fb.nonNullable.group({
    status: ['', Validators.required],
    delayedByHours: [0],
    reason: [''],
  });

  constructor() {
    this.form.patchValue({ status: this.toBackendStatus(this.data.currentStatus || 'CREATED') });

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

  get isUnchanged(): boolean {
    return this.toBackendStatus(this.data.currentStatus || '') === (this.form.controls.status.value || '');
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const { status, delayedByHours, reason } = this.form.getRawValue();
    const statusValue = status ?? '';

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
      this.shipments.updateStatus(this.data.shipmentId, { status: statusValue }).subscribe({
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

    this.shipments.updateStatus(this.data.shipmentId, { status: statusValue }).subscribe({
      next: () => afterSuccess('Status updated'),
      error: () => afterError('Failed to update status'),
      complete: () => {
        this.saving = false;
      },
    });
  }
}
