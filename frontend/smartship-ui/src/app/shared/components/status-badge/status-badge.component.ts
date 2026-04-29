import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './status-badge.component.html',
  styleUrls: ['./status-badge.component.scss'],
})
export class StatusBadgeComponent {
  @Input() status = '';

  get display(): string {
    return (this.status || '—')
      .trim()
      .replace(/_/g, ' ')
      .replace(/-/g, ' ')
      .replace(/\s+/g, ' ');
  }

  get toneClass(): Record<string, boolean> {
    const t = this.resolveTone();
    return {
      'ss-badge--neutral': t === 'neutral',
      'ss-badge--info': t === 'info',
      'ss-badge--success': t === 'success',
      'ss-badge--warning': t === 'warning',
      'ss-badge--danger': t === 'danger',
    };
  }

  private resolveTone(): StatusTone {
    const raw = (this.status || '').toUpperCase().replace(/-/g, ' ').trim();
    if (!raw) return 'neutral';
    if (raw.includes('DELIVERED') || raw.includes('COMPLETED')) return 'success';
    if (raw.includes('DELAY')) return 'warning';
    if (raw.includes('FAILED') || raw.includes('CANCEL') || raw.includes('RETURN')) return 'danger';
    if (raw.includes('TRANSIT') || raw.includes('PICKUP') || raw.includes('OUT FOR')) return 'info';
    if (raw.includes('PENDING') || raw.includes('CREATED') || raw.includes('DRAFT') || raw.includes('BOOKED')) return 'neutral';
    if (raw.includes('WAREHOUSE') || raw.includes('PROCESS')) return 'warning';
    return 'neutral';
  }
}
