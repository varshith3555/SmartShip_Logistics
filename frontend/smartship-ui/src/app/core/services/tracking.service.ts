import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateTrackingEventRequest,
  PostLocationRequest,
  TrackingHistoryDto,
  TrackingResponseDto,
  UpdateStatusRequest,
  UpdateTrackingEventRequest,
} from '../models/tracking.models';
import { ApiClient } from './api-client.service';

@Injectable({ providedIn: 'root' })
export class TrackingService {
  constructor(private readonly api: ApiClient) {}

  getTracking(trackingNumber: string): Observable<TrackingResponseDto> {
    return this.api.get<TrackingResponseDto>(`/gateway/tracking/${encodeURIComponent(trackingNumber)}`);
  }

  getTimeline(trackingNumber: string): Observable<TrackingHistoryDto[]> {
    return this.api.get<TrackingHistoryDto[]>(`/gateway/tracking/${encodeURIComponent(trackingNumber)}/timeline`);
  }

  getStatus(trackingNumber: string): Observable<{ status: string }> {
    return this.api.get<{ status: string }>(`/gateway/tracking/${encodeURIComponent(trackingNumber)}/status`);
  }

  // ADMIN
  createEvent(request: CreateTrackingEventRequest): Observable<unknown> {
    return this.api.post<unknown>('/gateway/tracking/events', request);
  }

  // ADMIN
  updateEvent(id: string, request: UpdateTrackingEventRequest): Observable<void> {
    return this.api.put<void>(`/gateway/tracking/events/${id}`, request);
  }

  // ADMIN
  deleteEvent(id: string): Observable<void> {
    return this.api.delete<void>(`/gateway/tracking/events/${id}`);
  }

  updateLocation(request: PostLocationRequest): Observable<void> {
    return this.api.post<void>('/gateway/tracking/location', request);
  }

  updateStatus(trackingNumber: string, request: UpdateStatusRequest): Observable<void> {
    return this.api.put<void>(`/gateway/tracking/${encodeURIComponent(trackingNumber)}/status`, request);
  }
}
