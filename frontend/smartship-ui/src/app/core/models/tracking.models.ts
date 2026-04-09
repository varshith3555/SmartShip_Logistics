export interface TrackingHistoryDto {
  status: string;
  location: string;
  timestamp: string;
  remarks: string;
}

export interface TrackingResponseDto {
  trackingNumber: string;
  currentStatus: string;
  lastUpdatedAt: string;
  history: TrackingHistoryDto[];
}

export interface CreateTrackingEventRequest {
  trackingNumber: string;
  status: string;
  location: string;
  remarks: string;
}

export interface UpdateTrackingEventRequest {
  status: string;
  location: string;
  remarks: string;
}

export interface PostLocationRequest {
  trackingNumber: string;
  currentLocation: string;
}

export interface UpdateStatusRequest {
  newStatus: string;
}
