import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../../core/services/admin.service';
import { ShipmentException } from '../../../../core/models/admin.models';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent {
  private readonly api = inject(AdminService);
  private readonly notify = inject(NotificationService);

  readonly days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  readonly barSeries = [42, 58, 46, 70, 62, 38, 55];

  issues: ShipmentException[] = [];
  issuesLoaded = false;

  readonly linePoints = [
    { x: 30, y: 110 },
    { x: 90, y: 92 },
    { x: 150, y: 84 },
    { x: 210, y: 70 },
    { x: 270, y: 62 },
    { x: 330, y: 54 },
    { x: 390, y: 48 },
  ];

  get linePath(): string {
    const [p0, ...rest] = this.linePoints;
    return `M ${p0.x},${p0.y}` + rest.map((p) => ` L ${p.x},${p.y}`).join('');
  }

  get areaPath(): string {
    const first = this.linePoints[0];
    const last = this.linePoints[this.linePoints.length - 1];
    return `${this.linePath} L ${last.x},140 L ${first.x},140 Z`;
  }

  constructor() {
    this.api.getExceptions().subscribe({
      next: (e) => {
        this.issues = (e ?? []).filter((x) => this.isCustomerIssue(x) && this.isOpen(x));
        this.issuesLoaded = true;
      },
      error: () => {
        this.issuesLoaded = true;
      },
    });
  }

  private isCustomerIssue(e: ShipmentException): boolean {
    const type = String(e.type ?? '').trim().toUpperCase();
    return type === 'CUSTOMERISSUE' || type === 'CUSTOMER_ISSUE' || type === 'CUSTOMER ISSUE' || type === 'ISSUE';
  }

  private isOpen(e: ShipmentException): boolean {
    return String(e.status ?? '').trim().toUpperCase() === 'OPEN';
  }

  resolveIssue(e: ShipmentException): void {
    if (!this.isOpen(e)) return;
    const resolution = window.prompt('Resolution details (optional):', 'Resolved') ?? undefined;
    if (resolution === undefined) return;

    this.api.resolveShipment(e.shipmentId, { resolutionDetails: (resolution ?? '').trim() || 'Resolved' }).subscribe({
      next: () => {
        this.notify.success('Issue resolved');
        // Remove from list optimistically.
        this.issues = this.issues.filter((x) => x.exceptionId !== e.exceptionId);
      },
      error: () => {
        this.notify.error('Failed to resolve issue');
      },
    });
  }
}
