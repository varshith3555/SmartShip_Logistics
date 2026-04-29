import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  CalculateRateRequest,
  CalculateRateResponse,
  CreateShipmentRequest,
  PickupDetails,
  SchedulePickupRequest,
  ServiceTypeDto,
  Shipment,
  ShipmentItem,
  UpdatePackageRequest,
  UpdateShipmentRequest,
  UpdateShipmentStatusRequest,
} from '../models/shipment.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class ShipmentService {
  constructor(private readonly api: ApiClient) {}

  private normalizeIsoAsUtc(value: string): string {
    if (!value) return value;
    // If it already contains a timezone/offset, keep as-is.
    if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
    // If it's an ISO string without timezone, treat it as UTC.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) return `${value}Z`;
    return value;
  }

  private normalizeShipment<T extends Shipment>(shipment: T): T {
    return {
      ...shipment,
      createdAt: this.normalizeIsoAsUtc(shipment.createdAt),
    };
  }

  private normalizeShipments(shipments: Shipment[]): Shipment[] {
    return shipments.map((s) => this.normalizeShipment(s));
  }

  createShipment(request: CreateShipmentRequest): Observable<Shipment> {
    return this.api.post<Shipment>('/gateway/shipments', request).pipe(map((s) => this.normalizeShipment(s)));
  }

  // CUSTOMER
  bookShipment(id: string): Observable<void> {
    return this.api.post<void>(`/gateway/shipments/${id}/book`, {});
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.api.get<Shipment>(`/gateway/shipments/${id}`).pipe(map((s) => this.normalizeShipment(s)));
  }

  getMyShipments(): Observable<Shipment[]> {
    return this.api.get<Shipment[]>('/gateway/shipments/my').pipe(map((s) => this.normalizeShipments(s)));
  }

  // ADMIN
  getAllShipments(customerId?: string): Observable<Shipment[]> {
    const path = customerId ? `/gateway/shipments?customerId=${encodeURIComponent(customerId)}` : '/gateway/shipments';
    return this.api.get<Shipment[]>(path).pipe(map((s) => this.normalizeShipments(s)));
  }

  // ADMIN
  updateStatus(id: string, request: UpdateShipmentStatusRequest): Observable<void> {
    return this.api.put<void>(`/gateway/shipments/${id}/status`, request);
  }

  // CUSTOMER
  schedulePickup(id: string, request: SchedulePickupRequest): Observable<void> {
    return this.api.post<void>(`/gateway/shipments/${id}/pickup`, request);
  }

  // CUSTOMER
  updatePickup(id: string, request: SchedulePickupRequest): Observable<void> {
    return this.api.put<void>(`/gateway/shipments/${id}/pickup`, request);
  }

  getPickupDetails(id: string): Observable<PickupDetails> {
    return this.api.get<PickupDetails>(`/gateway/shipments/${id}/pickup-details`);
  }

  // ADMIN
  deleteShipment(id: string): Observable<void> {
    return this.api.delete<void>(`/gateway/shipments/${id}`);
  }

  // ADMIN
  updateShipment(id: string, request: UpdateShipmentRequest): Observable<void> {
    return this.api.put<void>(`/gateway/shipments/${id}`, request);
  }

  // Packages
  addPackage(shipmentId: string, request: { itemName: string; quantity: number; weight: number }): Observable<ShipmentItem> {
    return this.api.post<ShipmentItem>(`/gateway/shipments/${shipmentId}/packages`, request);
  }

  getPackages(shipmentId: string): Observable<ShipmentItem[]> {
    return this.api.get<ShipmentItem[]>(`/gateway/shipments/${shipmentId}/packages`);
  }

  updatePackage(shipmentId: string, packageId: string, request: UpdatePackageRequest): Observable<void> {
    return this.api.put<void>(`/gateway/shipments/${shipmentId}/packages/${packageId}`, request);
  }

  deletePackage(shipmentId: string, packageId: string): Observable<void> {
    return this.api.delete<void>(`/gateway/shipments/${shipmentId}/packages/${packageId}`);
  }

  calculateRate(request: CalculateRateRequest): Observable<CalculateRateResponse> {
    return this.api.post<CalculateRateResponse>('/gateway/shipments/calculate-rate', request);
  }

  getServices(): Observable<ServiceTypeDto[]> {
    return this.api.get<ServiceTypeDto[]>('/gateway/shipments/services');
  }
}
