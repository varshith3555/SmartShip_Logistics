import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Hub, Location } from '../../../../core/models/admin.models';
import { AdminService } from '../../../../core/services/admin.service';
import { HubFormDialogComponent } from '../../components/hub-form-dialog/hub-form-dialog.component';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-hubs-locations',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatDialogModule, FormsModule, MatTooltipModule],
  templateUrl: './hubs-locations.component.html',
  styleUrls: ['./hubs-locations.component.scss'],
})
export class HubsLocationsComponent {
  private readonly api = inject(AdminService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  hubs: Hub[] = [];
  locations: Location[] = [];
  hubsLoaded = false;
  locsLoaded = false;

  searchQuery = '';

  constructor() {
    this.reload();
  }

  get filteredHubs(): Hub[] {
    if (!this.searchQuery) return this.hubs;
    const q = this.searchQuery.toLowerCase();
    return this.hubs.filter(h => 
      h.hubName.toLowerCase().includes(q) || 
      (h.location?.city || '').toLowerCase().includes(q) ||
      (h.location?.state || '').toLowerCase().includes(q)
    );
  }

  reload(): void {
    this.hubsLoaded = false;
    this.locsLoaded = false;

    this.api.getHubs().subscribe({
      next: (h) => {
        this.hubs = h;
        this.hubsLoaded = true;
      },
      error: () => {
        this.hubsLoaded = true;
      },
    });

    this.api.getLocations().subscribe({
      next: (l) => {
        this.locations = l;
        this.locsLoaded = true;
      },
      error: () => {
        this.locsLoaded = true;
      },
    });
  }

  formatLocation(h: Hub): string {
    const l = h.location;
    if (!l) return '—';
    return `${l.city}, ${l.state}`;
  }

  openHub(mode: 'create' | 'edit', hub: Hub | null): void {
    const ref = this.dialog.open(HubFormDialogComponent, {
      width: '520px',
      data: { mode, hub },
    });
    ref.afterClosed().subscribe((ok) => {
      if (ok) {
        this.reload();
      }
    });
  }

  deleteHub(h: Hub): void {
    const ok = window.confirm(`Delete hub "${h.hubName}"?`);
    if (!ok) return;
    this.api.deleteHub(h.hubId).subscribe({
      next: () => {
        this.notify.success('Hub deleted');
        this.reload();
      },
      error: () => {
        this.notify.error('Failed to delete hub');
      },
    });
  }

  deleteLocation(l: Location): void {
    const ok = window.confirm(`Delete location ${l.city}, ${l.state} — ${l.pincode}?`);
    if (!ok) return;
    this.api.deleteLocation(l.locationId).subscribe({
      next: () => {
        this.notify.success('Location deleted');
        this.reload();
      },
      error: () => {
        this.notify.error('Failed to delete location');
      },
    });
  }
}
