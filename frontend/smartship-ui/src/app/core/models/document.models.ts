export interface Document {
  documentId: string;
  shipmentId: string;
  customerId: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface DeliveryProof {
  proofId: string;
  shipmentId: string;
  imageUrl: string;
  signatureUrl: string;
  deliveredAt: string;
}
