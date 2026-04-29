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
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
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
