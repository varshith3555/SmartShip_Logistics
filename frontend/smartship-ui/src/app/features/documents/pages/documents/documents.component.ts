import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { of } from 'rxjs';
import { catchError, finalize, map } from 'rxjs/operators';
import { DocumentService } from '../../../../core/services/document.service';
import { Document } from '../../../../core/models/document.models';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ShipmentService } from '../../../../core/services/shipment.service';
import { Shipment } from '../../../../core/models/shipment.models';

type UploadKind = 'generic' | 'invoice' | 'label' | 'customs';

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatTableModule,
    MatIconModule,
  ],
  template: `
    <div class="sss-page">
      <h1 class="sss-title">Documents</h1>
      <p class="sss-sub">Load documents for a shipment, then upload new files securely.</p>

      <mat-card class="panel">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onLoad()" class="load-row">
            <mat-form-field appearance="outline" class="grow">
              <mat-label>Shipment Id</mat-label>
              <mat-select formControlName="shipmentId" [disabled]="shipmentsBusy">
                <mat-option *ngIf="shipmentsBusy" [disabled]="true" value="">Loading shipments…</mat-option>
                <mat-option *ngIf="!shipmentsBusy && !shipmentIds.length" [disabled]="true" value="">No shipments found</mat-option>
                <mat-option *ngFor="let id of shipmentIds" [value]="id">{{ id }}</mat-option>
              </mat-select>
            </mat-form-field>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy">
              <mat-icon>folder_open</mat-icon>
              Load
            </button>
          </form>

          <div class="upload-block">
            <div
              class="dropzone"
              [class.dropzone--active]="dragOver"
              (dragover)="onDragOver($event)"
              (dragleave)="onDragLeave($event)"
              (drop)="onDrop($event)"
              (click)="fileInput.click()"
              role="button"
              tabindex="0"
              (keydown.enter)="fileInput.click()"
            >
              <mat-icon class="drop-ico">cloud_upload</mat-icon>
              <div class="drop-title">Drag &amp; drop files here</div>
              <div class="drop-hint">or click to browse — PDF, images, labels</div>
              <input #fileInput class="visually-hidden" type="file" (change)="onFileSelected($event)" />
            </div>

            <div class="upload-controls">
              <mat-form-field appearance="outline" class="grow">
                <mat-label>Upload type</mat-label>
                <mat-select [value]="uploadKind" (selectionChange)="uploadKind = $event.value">
                  <mat-option value="generic">Generic</mat-option>
                  <mat-option value="invoice">Invoice</mat-option>
                  <mat-option value="label">Label</mat-option>
                  <mat-option value="customs">Customs</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-stroked-button type="button" (click)="fileInput.click()">
                <mat-icon>attach_file</mat-icon>
                Choose file
              </button>

              <button mat-flat-button color="primary" type="button" (click)="onUpload()" [disabled]="!selectedFile || form.invalid || busy">
                <mat-icon>upload</mat-icon>
                Upload
              </button>
            </div>

            <div class="file-pill" *ngIf="selectedFile">
              <mat-icon>insert_drive_file</mat-icon>
              <span>{{ selectedFile.name }}</span>
              <button mat-icon-button type="button" (click)="clearFile($event)" aria-label="Clear file">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>

          <div class="table-card" *ngIf="documents.length">
            <table mat-table [dataSource]="documents" class="doc-table">
              <ng-container matColumnDef="fileName">
                <th mat-header-cell *matHeaderCellDef>File name</th>
                <td mat-cell *matCellDef="let d">
                  <span class="file-cell">
                    <mat-icon class="file-ico">description</mat-icon>
                    {{ d.fileName }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="fileType">
                <th mat-header-cell *matHeaderCellDef>Type</th>
                <td mat-cell *matCellDef="let d">
                  <span class="type-pill">{{ d.fileType }}</span>
                </td>
              </ng-container>

              <ng-container matColumnDef="uploadedAt">
                <th mat-header-cell *matHeaderCellDef>Uploaded date</th>
                <td mat-cell *matCellDef="let d">{{ d.uploadedAt | date : 'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="url">
                <th mat-header-cell *matHeaderCellDef>Download</th>
                <td mat-cell *matCellDef="let d" class="actions">
                  <a
                    mat-stroked-button
                    color="primary"
                    [href]="d.fileUrl"
                    target="_blank"
                    rel="noopener"
                    [attr.download]="d.fileName"
                  >
                    <mat-icon>download</mat-icon>
                    Download
                  </a>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
            </table>
          </div>

          <p class="empty" *ngIf="!documents.length && form.valid && loadedOnce">No documents found for this shipment.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [
    `
      .sss-page {
        max-width: 960px;
        margin: 0 auto;
      }
      .sss-title {
        margin: 0 0 4px;
        font-size: 1.5rem;
        font-weight: 600;
      }
      .sss-sub {
        margin: 0 0 18px;
        color: var(--ss-text-muted);
      }
      .load-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        flex-wrap: wrap;
      }
      .grow {
        flex: 1 1 280px;
      }
      .upload-block {
        margin-top: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .dropzone {
        border: 2px dashed rgba(21, 101, 192, 0.35);
        border-radius: var(--ss-radius);
        padding: 26px 18px;
        text-align: center;
        cursor: pointer;
        background: rgba(21, 101, 192, 0.04);
        transition: border-color 0.15s ease, background 0.15s ease, transform 0.12s ease;
      }
      .dropzone:hover {
        border-color: rgba(21, 101, 192, 0.65);
        background: rgba(21, 101, 192, 0.07);
      }
      .dropzone--active {
        border-color: var(--ss-primary);
        background: rgba(21, 101, 192, 0.1);
        transform: scale(1.01);
      }
      .drop-ico {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--ss-primary);
      }
      .drop-title {
        font-weight: 650;
        margin-top: 6px;
      }
      .drop-hint {
        margin-top: 4px;
        color: var(--ss-text-muted);
        font-size: 0.92rem;
      }
      .visually-hidden {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
      .upload-controls {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        align-items: flex-start;
      }
      .file-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: 999px;
        background: rgba(15, 23, 42, 0.05);
        border: 1px solid var(--ss-border);
        max-width: 100%;
      }
      .file-pill span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .table-card {
        margin-top: 16px;
        overflow: auto;
        border-radius: 10px;
        border: 1px solid var(--ss-border);
      }
      .doc-table {
        width: 100%;
      }
      .file-cell {
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }
      .file-ico {
        color: rgba(15, 23, 42, 0.45);
      }
      .type-pill {
        padding: 2px 10px;
        border-radius: 999px;
        background: rgba(100, 116, 139, 0.12);
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .actions {
        text-align: right;
      }
      .empty {
        margin: 12px 0 0;
        color: var(--ss-text-muted);
      }
    `,
  ],
})
export class DocumentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(DocumentService);
  private readonly notify = inject(NotificationService);
  private readonly shipmentsApi = inject(ShipmentService);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.group({
    shipmentId: ['', [Validators.required]],
  });

  uploadKind: UploadKind = 'generic';
  selectedFile: File | null = null;
  dragOver = false;
  busy = false;
  loadedOnce = false;

  shipmentsBusy = false;
  shipmentIds: string[] = [];

  documents: Document[] = [];
  displayedColumns = ['fileName', 'fileType', 'uploadedAt', 'url'];

  ngOnInit(): void {
    this.loadShipmentIds();
  }

  private loadShipmentIds(): void {
    this.shipmentsBusy = true;

    const role = (this.auth.role ?? '').toUpperCase();
    const shipments$ = role === 'ADMIN' ? this.shipmentsApi.getAllShipments() : this.shipmentsApi.getMyShipments();

    shipments$
      .pipe(
        map((shipments: Shipment[]) => {
          const unique = new Set(shipments.map((s) => s.shipmentId).filter(Boolean));
          return Array.from(unique).sort();
        }),
        finalize(() => {
          this.shipmentsBusy = false;
        }),
        catchError(() => {
          this.notify.error('Failed to load shipment list');
          return of([] as string[]);
        }),
      )
      .subscribe((ids) => {
        this.shipmentIds = ids;
      });
  }

  onLoad(): void {
    if (this.form.invalid) return;
    const shipmentId = this.form.getRawValue().shipmentId ?? '';
    this.busy = true;
    this.api.getByShipment(shipmentId).subscribe({
      next: (docs) => {
        this.documents = docs;
        this.loadedOnce = true;
      },
      error: () => {
        this.busy = false;
      },
      complete: () => {
        this.busy = false;
      },
    });
  }

  onFileSelected(evt: Event): void {
    const input = evt.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  clearFile(evt: Event): void {
    evt.stopPropagation();
    this.selectedFile = null;
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
    const file = event.dataTransfer?.files?.[0];
    if (file) this.selectedFile = file;
  }

  onUpload(): void {
    if (!this.selectedFile || this.form.invalid || this.busy) return;

    const shipmentId = this.form.getRawValue().shipmentId ?? '';
    this.busy = true;

    const call =
      this.uploadKind === 'invoice'
        ? this.api.uploadInvoice(shipmentId, this.selectedFile)
        : this.uploadKind === 'label'
          ? this.api.uploadLabel(shipmentId, this.selectedFile)
          : this.uploadKind === 'customs'
            ? this.api.uploadCustoms(shipmentId, this.selectedFile)
            : this.api.uploadDocument(shipmentId, this.selectedFile);

    call.subscribe({
      next: () => {
        this.notify.success('File uploaded successfully');
        this.selectedFile = null;
        this.onLoad();
      },
      error: () => {
        this.busy = false;
      },
    });
  }
}
