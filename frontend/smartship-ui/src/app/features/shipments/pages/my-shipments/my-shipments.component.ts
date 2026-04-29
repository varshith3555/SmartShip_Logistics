import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-my-shipments',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    StatusBadgeComponent,
  ],
  templateUrl: './my-shipments.component.html',
  styleUrls: ['./my-shipments.component.scss'],
})
export class MyShipmentsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shipmentsApi = inject(ShipmentService);

  private allShipments: Shipment[] = [];
  shipments: Shipment[] = [];
  displayedColumns = ['trackingNumber', 'status', 'createdAt', 'actions'];
  loaded = false;

  statusOptions: string[] = [];

  readonly filterForm = this.fb.nonNullable.group({
    query: [''],
    status: [''],
  });

  constructor() {
    this.shipmentsApi.getMyShipments().subscribe({
      next: (data) => {
        this.allShipments = data;
        this.buildStatusOptions(data);
        this.applyFilters();
      },
      error: () => {
        this.loaded = true;
      },
      complete: () => {
        this.loaded = true;
      },
    });

    this.filterForm.valueChanges.subscribe(() => this.applyFilters());
  }

  private buildStatusOptions(rows: Shipment[]): void {
    const values = new Set<string>();
    for (const s of rows) {
      if (s.status) {
        values.add(s.status);
      }
    }
    this.statusOptions = Array.from(values).sort();
  }

  private applyFilters(): void {
    const raw = this.filterForm.getRawValue();
    const query = (raw.query ?? '').toString().trim().toLowerCase();
    const status = (raw.status ?? '').toString().trim();

    this.shipments = this.allShipments.filter((s) => {
      const tn = (s.trackingNumber ?? '').toLowerCase();
      const matchesQuery = !query || tn.includes(query);
      const matchesStatus = !status || s.status === status;
      return matchesQuery && matchesStatus;
    });
  }
}
