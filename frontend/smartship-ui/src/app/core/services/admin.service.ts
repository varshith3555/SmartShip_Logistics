import { Injectable } from '@angular/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  DelayShipmentRequest,
  Hub,
  HubDto,
  Location,
  LocationDto,
  Report,
  ResolveExceptionRequest,
  ReturnShipmentRequest,
  ShipmentException,
} from '../models/admin.models';
import { Shipment } from '../models/shipment.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiClient) {}

  private normalizeIsoAsUtc(value: string): string {
    if (!value) return value;
    // If it already contains a timezone/offset, keep as-is.
    if (/[zZ]$/.test(value) || /[+-]\d{2}:\d{2}$/.test(value)) return value;
    // If it's an ISO string without timezone, treat it as UTC.
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/.test(value)) return `${value}Z`;
    return value;
  }

  private normalizeException(e: ShipmentException): ShipmentException {
    return {
      ...e,
      createdAt: this.normalizeIsoAsUtc(e.createdAt),
    };
  }

  private normalizeReport(r: Report): Report {
    return {
      ...r,
      generatedAt: this.normalizeIsoAsUtc(r.generatedAt),
    };
  }

  private normalizeShipment(s: Shipment): Shipment {
    return {
      ...s,
      createdAt: this.normalizeIsoAsUtc(s.createdAt),
    };
  }

  dashboard(): Observable<{ totalHubs: number; openExceptions: number }> {
    return this.api.get<{ totalHubs: number; openExceptions: number }>('/gateway/admin/dashboard');
  }

  // SHIPMENTS (ADMIN monitoring)
  getShipments(): Observable<Shipment[]> {
    return this.api.get<Shipment[]>('/gateway/admin/shipments').pipe(map((s) => (s ?? []).map((x) => this.normalizeShipment(x))));
  }

  getShipmentById(id: string): Observable<Shipment> {
    return this.api.get<Shipment>(`/gateway/admin/shipments/${encodeURIComponent(id)}`).pipe(map((s) => this.normalizeShipment(s)));
  }

  statistics(): Observable<{ revenue: number; shipmentsHandled: number; activeUsers: number }> {
    return this.api.get<{ revenue: number; shipmentsHandled: number; activeUsers: number }>('/gateway/admin/statistics');
  }

  getExceptions(): Observable<ShipmentException[]> {
    return this.api
      .get<ShipmentException[]>('/gateway/admin/exceptions')
      .pipe(map((e) => e.map((x) => this.normalizeException(x))));
  }

  getResolvedExceptions(): Observable<ShipmentException[]> {
    return this.api
      .get<ShipmentException[]>('/gateway/admin/exceptions/resolved')
      .pipe(map((e) => e.map((x) => this.normalizeException(x))));
  }

  getAllExceptions(): Observable<ShipmentException[]> {
    // Prefer combining explicit open/resolved endpoints so the
    // Closed filter always has data even if /exceptions/all is missing.
    return forkJoin({
      open: this.getExceptions(),
      resolved: this.api
        .get<ShipmentException[]>('/gateway/admin/exceptions/resolved')
        .pipe(
          map((e) => e.map((x) => this.normalizeException(x))),
          catchError((err) => {
            // If /exceptions/resolved doesn't exist yet, treat as no resolved items.
            if (err?.status === 404) {
              return of<ShipmentException[]>([]);
            }
            return throwError(() => err);
          })
        ),
    }).pipe(map(({ open, resolved }) => [...open, ...resolved]));
  }

  resolveShipment(shipmentId: string, request: ResolveExceptionRequest): Observable<void> {
    return this.api.put<void>(`/gateway/admin/shipments/${shipmentId}/resolve`, request);
  }

  delayShipment(shipmentId: string, request: DelayShipmentRequest): Observable<void> {
    return this.api.put<void>(`/gateway/admin/shipments/${shipmentId}/delay`, request);
  }

  returnShipment(shipmentId: string, request: ReturnShipmentRequest): Observable<void> {
    return this.api.put<void>(`/gateway/admin/shipments/${shipmentId}/return`, request);
  }

  // Hubs
  getHubs(): Observable<Hub[]> {
    return this.api.get<Hub[]>('/gateway/admin/hubs');
  }

  getHubById(id: string): Observable<Hub> {
    return this.api.get<Hub>(`/gateway/admin/hubs/${id}`);
  }

  createHub(dto: HubDto): Observable<Hub> {
    return this.api.post<Hub>('/gateway/admin/hubs', dto);
  }

  updateHub(id: string, dto: HubDto): Observable<void> {
    return this.api.put<void>(`/gateway/admin/hubs/${id}`, dto);
  }

  deleteHub(id: string): Observable<void> {
    return this.api.delete<void>(`/gateway/admin/hubs/${id}`);
  }

  // Locations
  getLocations(): Observable<Location[]> {
    return this.api.get<Location[]>('/gateway/admin/locations');
  }

  createLocation(dto: LocationDto): Observable<Location> {
    return this.api.post<Location>('/gateway/admin/locations', dto);
  }

  updateLocation(id: string, dto: LocationDto): Observable<void> {
    return this.api.put<void>(`/gateway/admin/locations/${id}`, dto);
  }

  deleteLocation(id: string): Observable<void> {
    return this.api.delete<void>(`/gateway/admin/locations/${id}`);
  }

  // Reports
  getReports(): Observable<Report[]> {
    return this.api.get<Report[]>('/gateway/admin/reports').pipe(map((r) => r.map((x) => this.normalizeReport(x))));
  }

  getShipmentPerformanceReport(): Observable<Report> {
    return this.api.get<Report>('/gateway/admin/reports/shipment-performance').pipe(map((r) => this.normalizeReport(r)));
  }

  getDeliverySlaReport(): Observable<Report> {
    return this.api.get<Report>('/gateway/admin/reports/delivery-sla').pipe(map((r) => this.normalizeReport(r)));
  }

  getRevenueReport(): Observable<Report> {
    return this.api.get<Report>('/gateway/admin/reports/revenue').pipe(map((r) => this.normalizeReport(r)));
  }

  getHubPerformanceReport(): Observable<Report> {
    return this.api.get<Report>('/gateway/admin/reports/hub-performance').pipe(map((r) => this.normalizeReport(r)));
  }
}
