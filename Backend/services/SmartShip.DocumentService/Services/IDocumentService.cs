using SmartShip.DocumentService.Models;
using Microsoft.AspNetCore.Http;

namespace SmartShip.DocumentService.Services;

/// <summary>
/// Business logic abstraction for uploading and managing shipment documents.
/// </summary>
public interface IDocumentService
{
    Task<Document> UploadDocumentAsync(Guid shipmentId, Guid customerId, IFormFile file, string fileType);
    Task<IEnumerable<Document>> GetShipmentDocumentsAsync(Guid shipmentId);
    Task<DeliveryProof> UploadDeliveryProofAsync(Guid shipmentId, IFormFile image, IFormFile signature);
    Task<DeliveryProof?> GetDeliveryProofAsync(Guid shipmentId);
    Task<Document?> GetDocumentAsync(Guid documentId);
    Task<IEnumerable<Document>> GetCustomerDocumentsAsync(Guid customerId);
    Task UpdateDocumentAsync(Guid documentId, string newFileType);
    Task DeleteDocumentAsync(Guid documentId);
}
