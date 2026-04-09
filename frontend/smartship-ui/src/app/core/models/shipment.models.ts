export interface Address {
  addressId?: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ShipmentItem {
  itemId?: string;
  shipmentId?: string;
  itemName: string;
  quantity: number;
  weight: number;
}

export interface PickupDetails {
  pickupId?: string;
  shipmentId?: string;
  scheduledDate: string;
  pickupStatus?: string;
}

export interface Payment {
  paymentId?: string;
  shipmentId?: string;
  amount: number;
  paymentStatus?: string;
  paymentDate?: string | null;
}

export interface Shipment {
  shipmentId: string;
  trackingNumber: string;
  userId: string;
  senderAddressId?: string;
  receiverAddressId?: string;
  hubId: string;
  status: string;
  totalWeight: number;
  price: number;
  createdAt: string;
  senderAddress: Address;
  receiverAddress: Address;
  items: ShipmentItem[];
  pickupDetails?: PickupDetails | null;
  payment?: Payment | null;
}

export interface AddressDto {
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export interface ShipmentItemDto {
  itemName: string;
  quantity: number;
  weight: number;
}

export interface CreateShipmentRequest {
  senderAddress: AddressDto;
  receiverAddress: AddressDto;
  items: ShipmentItemDto[];
}

export interface UpdateShipmentStatusRequest {
  status: string;
}

export interface SchedulePickupRequest {
  scheduledDate: string;
}

export interface UpdateShipmentRequest {
  totalWeight: number;
}

export interface AddPackageRequest {
  itemName: string;
  quantity: number;
  weight: number;
}

export interface UpdatePackageRequest {
  itemName: string;
  quantity: number;
  weight: number;
}

export interface CalculateRateRequest {
  totalWeight: number;
  originPincode: string;
  destinationPincode: string;
}

export interface CalculateRateResponse {
  estimatedPrice: number;
}

export interface ServiceTypeDto {
  serviceName: string;
  description: string;
  basePrice: number;
}
