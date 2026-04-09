export interface Location {
  locationId: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface Hub {
  hubId: string;
  hubName: string;
  locationId: string;
  capacity: number;
  location?: Location;
}

export interface ShipmentException {
  exceptionId: string;
  shipmentId: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

export interface Report {
  reportId: string;
  reportType: string;
  generatedAt: string;
  dataJson: string;
}

export interface HubDto {
  hubName: string;
  locationId: string;
  capacity: number;
}

export interface LocationDto {
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ResolveExceptionRequest {
  resolutionDetails: string;
}

export interface DelayShipmentRequest {
  delayedByHours: number;
  reason: string;
}

export interface ReturnShipmentRequest {
  reason: string;
}
