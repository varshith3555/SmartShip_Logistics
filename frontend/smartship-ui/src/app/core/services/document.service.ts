import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Document, DeliveryProof } from '../models/document.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  constructor(private readonly api: ApiClient) {}

  uploadDocument(shipmentId: string, file: File): Observable<Document> {
    const form = new FormData();
    form.append('shipmentId', shipmentId);
    form.append('file', file);
    return this.api.post<Document>('/gateway/documents/upload', form);
  }

  uploadInvoice(shipmentId: string, file: File): Observable<Document> {
    const form = new FormData();
    form.append('shipmentId', shipmentId);
    form.append('file', file);
    return this.api.post<Document>('/gateway/documents/upload-invoice', form);
  }

  uploadLabel(shipmentId: string, file: File): Observable<Document> {
    const form = new FormData();
    form.append('shipmentId', shipmentId);
    form.append('file', file);
    return this.api.post<Document>('/gateway/documents/upload-label', form);
  }

  uploadCustoms(shipmentId: string, file: File): Observable<Document> {
    const form = new FormData();
    form.append('shipmentId', shipmentId);
    form.append('file', file);
    return this.api.post<Document>('/gateway/documents/upload-customs', form);
  }

  getDocumentById(id: string): Observable<Document> {
    return this.api.get<Document>(`/gateway/documents/${id}`);
  }

  getByShipment(shipmentId: string): Observable<Document[]> {
    return this.api.get<Document[]>(`/gateway/documents/shipment/${shipmentId}`);
  }

  getByCustomer(customerId: string): Observable<Document[]> {
    return this.api.get<Document[]>(`/gateway/documents/customer/${customerId}`);
  }

  // ADMIN
  updateDocument(id: string, fileType: string): Observable<void> {
    return this.api.put<void>(`/gateway/documents/${id}?fileType=${encodeURIComponent(fileType)}`, {});
  }

  // ADMIN
  deleteDocument(id: string): Observable<{ message: string } | unknown> {
    return this.api.delete<{ message: string }>(`/gateway/documents/${id}`);
  }

  // ADMIN multipart
  uploadDeliveryProof(shipmentId: string, image: File, signature: File): Observable<DeliveryProof> {
    const form = new FormData();
    form.append('image', image);
    form.append('signature', signature);
    return this.api.post<DeliveryProof>(`/gateway/documents/delivery-proof/${shipmentId}`, form);
  }

  getDeliveryProof(shipmentId: string): Observable<DeliveryProof> {
    return this.api.get<DeliveryProof>(`/gateway/documents/delivery-proof/${shipmentId}`);
  }
}
