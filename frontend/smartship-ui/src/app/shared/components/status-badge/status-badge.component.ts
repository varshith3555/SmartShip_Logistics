import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';

export type StatusTone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [NgClass],
  template: `<span class="ss-badge" [ngClass]="toneClass">{{ display }}</span>`,
  styles: [
    `
      .ss-badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 4px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.03em;
        line-height: 1.4;
        white-space: nowrap;
        text-transform: uppercase;
        border: 1px solid transparent;
      }
      .ss-badge--neutral {
        background: #f3f4f6;
        color: #4b5563;
        border-color: #e5e7eb;
      }
      .ss-badge--info {
        background: #dbeafe;
        color: #1e40af;
        border-color: #bfdbfe;
      }
      .ss-badge--success {
        background: #d1fae5;
        color: #065f46;
        border-color: #a7f3d0;
      }
      .ss-badge--warning {
        background: #fef3c7;
        color: #92400e;
        border-color: #fde68a;
      }
      .ss-badge--danger {
        background: #fee2e2;
        color: #991b1b;
        border-color: #fecaca;
      }
    `,
  ],
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
    if (raw.includes('FAILED') || raw.includes('CANCEL')) return 'danger';
    if (raw.includes('TRANSIT') || raw.includes('PICKUP') || raw.includes('OUT FOR')) return 'info';
    if (raw.includes('PENDING') || raw.includes('CREATED') || raw.includes('BOOKED')) return 'neutral';
    if (raw.includes('WAREHOUSE') || raw.includes('PROCESS')) return 'warning';
    return 'neutral';
  }
}
