import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute } from '@angular/router';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-shipment-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatDividerModule, MatIconModule, StatusBadgeComponent],
  template: `
    <div class="sss-page" *ngIf="shipment as s">
      <div class="hero">
        <div>
          <div class="eyebrow">Shipment</div>
          <h1 class="title">Details</h1>
          <p class="sub">
            <span class="mono">{{ s.trackingNumber }}</span>
          </p>
        </div>
        <app-status-badge [status]="s.status" />
      </div>

      <div class="grid">
        <mat-card>
          <mat-card-header>
            <div mat-card-avatar class="avatar">
              <mat-icon>badge</mat-icon>
            </div>
            <mat-card-title>Summary</mat-card-title>
            <mat-card-subtitle>Identifiers and pricing</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="kv">
              <div class="k">Shipment ID</div>
              <div class="v mono">{{ s.shipmentId }}</div>
            </div>
            <mat-divider />
            <div class="kv">
              <div class="k">Hub</div>
              <div class="v mono">{{ s.hubId }}</div>
            </div>
            <mat-divider />
            <div class="kv">
              <div class="k">Total weight</div>
              <div class="v">{{ s.totalWeight }} kg</div>
            </div>
            <mat-divider />
            <div class="kv">
              <div class="k">Price</div>
              <div class="v">{{ s.price | number : '1.2-2' }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <div mat-card-avatar class="avatar avatar--muted">
              <mat-icon>person_pin_circle</mat-icon>
            </div>
            <mat-card-title>Sender</mat-card-title>
            <mat-card-subtitle>Pickup details</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="addr">
              <div class="strong">{{ s.senderAddress.name }}</div>
              <div class="muted">{{ s.senderAddress.phone }}</div>
              <div class="line">{{ s.senderAddress.street }}</div>
              <div class="line">{{ s.senderAddress.city }}, {{ s.senderAddress.state }} — {{ s.senderAddress.pincode }}</div>
              <div class="line">{{ s.senderAddress.country }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <div mat-card-avatar class="avatar avatar--muted">
              <mat-icon>place</mat-icon>
            </div>
            <mat-card-title>Receiver</mat-card-title>
            <mat-card-subtitle>Delivery details</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="addr">
              <div class="strong">{{ s.receiverAddress.name }}</div>
              <div class="muted">{{ s.receiverAddress.phone }}</div>
              <div class="line">{{ s.receiverAddress.street }}</div>
              <div class="line">{{ s.receiverAddress.city }}, {{ s.receiverAddress.state }} — {{ s.receiverAddress.pincode }}</div>
              <div class="line">{{ s.receiverAddress.country }}</div>
            </div>
          </mat-card-content>
        </mat-card>

        <mat-card class="wide">
          <mat-card-header>
            <div mat-card-avatar class="avatar">
              <mat-icon>inventory</mat-icon>
            </div>
            <mat-card-title>Items</mat-card-title>
            <mat-card-subtitle>Packages in this shipment</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="items">
              <div class="item" *ngFor="let it of s.items">
                <div class="item-name">{{ it.itemName }}</div>
                <div class="item-meta">
                  <span>Qty: {{ it.quantity }}</span>
                  <span>Weight: {{ it.weight }} kg</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 1100px;
        margin: 0 auto;
      }
      .hero {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 16px;
      }
      .eyebrow {
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--ss-text-muted);
      }
      .title {
        margin: 4px 0 6px;
        font-size: 1.6rem;
        font-weight: 750;
        letter-spacing: -0.03em;
      }
      .sub {
        margin: 0;
        color: var(--ss-text-muted);
      }
      .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
      }
      .wide {
        grid-column: 1 / -1;
      }
      @media (max-width: 900px) {
        .grid {
          grid-template-columns: 1fr;
        }
        .wide {
          grid-column: auto;
        }
      }
      .avatar {
        background: var(--ss-primary-light);
        color: var(--ss-primary);
        display: grid;
        place-items: center;
      }
      .avatar mat-icon {
        font-size: 22px;
        width: 22px;
        height: 22px;
      }
      .avatar--muted {
        background: rgba(100, 116, 139, 0.12);
        color: #334155;
      }
      .kv {
        display: grid;
        grid-template-columns: 160px 1fr;
        gap: 12px;
        padding: 10px 0;
        align-items: baseline;
      }
      .k {
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
      .v {
        font-weight: 650;
      }
      .addr {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .strong {
        font-weight: 750;
      }
      .muted {
        color: var(--ss-text-muted);
      }
      .line {
        color: var(--ss-text);
      }
      .items {
        display: grid;
        gap: 10px;
      }
      .item {
        border: 1px solid var(--ss-border);
        border-radius: 12px;
        padding: 12px;
        background: rgba(248, 250, 252, 0.8);
      }
      .item-name {
        font-weight: 700;
      }
      .item-meta {
        margin-top: 6px;
        display: flex;
        gap: 14px;
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
    `,
  ],
})
export class ShipmentDetailsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ShipmentService);

  shipment: Shipment | null = null;

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.api.getShipmentById(id).subscribe({
        next: (s) => (this.shipment = s),
      });
    }
  }
}
