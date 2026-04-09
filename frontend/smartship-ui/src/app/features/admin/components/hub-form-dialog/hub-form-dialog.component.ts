import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Hub, Location } from '../../../../core/models/admin.models';
import { AdminService } from '../../../../core/services/admin.service';
import { NotificationService } from '../../../../core/services/notification.service';

export interface HubFormDialogData {
  mode: 'create' | 'edit';
  hub: Hub | null;
}

@Component({
  selector: 'app-hub-form-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'Add hub' : 'Edit hub' }}</h2>
    <form mat-dialog-content [formGroup]="form" (ngSubmit)="save()">
      <mat-form-field appearance="outline" class="full">
        <mat-label>Hub name</mat-label>
        <input matInput formControlName="hubName" />
      </mat-form-field>

      <div class="loc">
        <mat-form-field appearance="outline" class="full">
          <mat-label>City</mat-label>
          <input matInput formControlName="city" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>State</mat-label>
          <input matInput formControlName="state" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Country</mat-label>
          <input matInput formControlName="country" />
        </mat-form-field>

        <mat-form-field appearance="outline" class="full">
          <mat-label>Pincode</mat-label>
          <input matInput formControlName="pincode" inputmode="numeric" />
        </mat-form-field>
      </div>

      <mat-form-field appearance="outline" class="full">
        <mat-label>Capacity</mat-label>
        <input matInput type="number" formControlName="capacity" />
      </mat-form-field>
    </form>
    <div mat-dialog-actions align="end">
      <button mat-button type="button" (click)="ref.close()">Cancel</button>
      <button mat-flat-button color="primary" type="button" (click)="save()" [disabled]="form.invalid || saving">
        {{ saving ? 'Saving…' : 'Save' }}
      </button>
    </div>
  `,
  styles: [
    `
      .full {
        width: 100%;
      }
      .loc {
        margin-top: 4px;
      }
    `,
  ],
})
export class HubFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(AdminService);
  private readonly notify = inject(NotificationService);
  readonly ref = inject(MatDialogRef<HubFormDialogComponent, boolean>);
  readonly data = inject<HubFormDialogData>(MAT_DIALOG_DATA);

  locations: Location[] = [];
  saving = false;

  readonly form = this.fb.nonNullable.group({
    hubName: ['', Validators.required],
    city: ['', [Validators.required, Validators.minLength(2)]],
    state: ['', [Validators.required, Validators.minLength(2)]],
    country: ['', [Validators.required, Validators.minLength(2)]],
    pincode: ['', [Validators.required, Validators.minLength(3)]],
    capacity: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    const h = this.data.hub;
    if (h) {
      this.form.patchValue({
        hubName: h.hubName,
        capacity: h.capacity,
      });
    }
    this.api.getLocations().subscribe({
      next: (locs) => {
        this.locations = locs;

        // If we're editing and hub location details are available, prefill.
        const hub = this.data.hub;
        if (!hub) return;

        const locFromHub = hub.location;
        const loc = locFromHub ?? this.locations.find((x) => x.locationId === hub.locationId);
        if (!loc) return;

        this.form.patchValue({
          city: loc.city,
          state: loc.state,
          country: loc.country,
          pincode: loc.pincode,
        });
      },
      error: () => {
        // Even if locations fail to load, user can still create a new location on save.
        this.notify.error('Failed to load locations');
      },
    });
  }

  private normText(v: string): string {
    return (v ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  private normPin(v: string): string {
    return (v ?? '').trim().replace(/\s+/g, '');
  }

  private async resolveLocationId(dto: { city: string; state: string; country: string; pincode: string }): Promise<string> {
    const city = this.normText(dto.city);
    const state = this.normText(dto.state);
    const country = this.normText(dto.country);
    const pincode = this.normPin(dto.pincode);

    const existing = this.locations.find(
      (l) =>
        this.normText(l.city) === city &&
        this.normText(l.state) === state &&
        this.normText(l.country) === country &&
        this.normPin(l.pincode) === pincode,
    );
    if (existing) return existing.locationId;

    // Create new location.
    const created = await new Promise<Location>((resolve, reject) => {
      this.api
        .createLocation({ city: dto.city.trim(), state: dto.state.trim(), country: dto.country.trim(), pincode })
        .subscribe({
          next: (l) => resolve(l),
          error: (e) => reject(e),
        });
    });

    // Keep local cache updated so subsequent hubs can reuse.
    this.locations = [...this.locations, created];
    return created.locationId;
  }

  save(): void {
    if (this.form.invalid || this.saving) return;
    this.saving = true;

    const raw = this.form.getRawValue();

    const done = (): void => {
      this.notify.success(this.data.mode === 'create' ? 'Hub created' : 'Hub updated');
      this.ref.close(true);
    };

    const end = (): void => {
      this.saving = false;
    };

    const locationDto = {
      city: raw.city,
      state: raw.state,
      country: raw.country,
      pincode: raw.pincode,
    };

    this.resolveLocationId(locationDto)
      .then((locationId) => {
        const hubDto = {
          hubName: raw.hubName,
          locationId,
          capacity: raw.capacity,
        };

        if (this.data.mode === 'create') {
          this.api.createHub(hubDto).subscribe({
            next: () => done(),
            error: () => {
              this.notify.error('Failed to create hub');
              end();
            },
            complete: () => end(),
          });
        } else {
          this.api.updateHub(this.data.hub!.hubId, hubDto).subscribe({
            next: () => done(),
            error: () => {
              this.notify.error('Failed to update hub');
              end();
            },
            complete: () => end(),
          });
        }
      })
      .catch(() => {
        this.notify.error('Failed to save location');
        end();
      });
  }
}
