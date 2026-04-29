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
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
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

  private readonly maxBytes = 10 * 1024 * 1024; // 10 MB
  private readonly allowedExt = new Set(['.pdf', '.png', '.jpg', '.jpeg']);

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
    const file = input.files?.[0] ?? null;
    this.setSelectedFile(file);
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
    const file = event.dataTransfer?.files?.[0] ?? null;
    this.setSelectedFile(file);
  }

  private setSelectedFile(file: File | null): void {
    if (!file) {
      this.selectedFile = null;
      return;
    }

    const ext = `.${(file.name.split('.').pop() ?? '').toLowerCase()}`;
    if (!this.allowedExt.has(ext)) {
      this.notify.error('Invalid file type. Allowed: PDF, PNG, JPG, JPEG');
      this.selectedFile = null;
      return;
    }

    if (file.size > this.maxBytes) {
      this.notify.error('File too large. Max allowed is 10MB');
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
  }

  onUpload(): void {
    if (!this.selectedFile || this.form.invalid || this.busy) return;

    // Re-validate in case file was set programmatically.
    this.setSelectedFile(this.selectedFile);
    if (!this.selectedFile) return;

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
        this.notify.error('Failed to upload file');
        this.busy = false;
      },
    });
  }
}
