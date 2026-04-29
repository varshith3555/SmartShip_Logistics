using SmartShip.DocumentService.Models;

namespace SmartShip.DocumentService.Repositories;

/// <summary>
/// Data-access abstraction for documents and delivery proofs.
/// </summary>
public interface IDocumentRepository
{
    Task<Document> AddDocumentAsync(Document document);
    Task<IEnumerable<Document>> GetDocumentsByShipmentAsync(Guid shipmentId);
    Task<DeliveryProof> AddDeliveryProofAsync(DeliveryProof proof);
    Task<DeliveryProof?> GetDeliveryProofAsync(Guid shipmentId);
    Task<Document?> GetDocumentAsync(Guid id);
    Task<IEnumerable<Document>> GetDocumentsByCustomerAsync(Guid customerId);
    Task UpdateDocumentAsync(Document document);
    Task DeleteDocumentAsync(Document document);
}
