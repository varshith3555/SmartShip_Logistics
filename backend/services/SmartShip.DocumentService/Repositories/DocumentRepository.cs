using Microsoft.EntityFrameworkCore;
using SmartShip.DocumentService.Data;
using SmartShip.DocumentService.Models;

namespace SmartShip.DocumentService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IDocumentRepository"/>.
/// </summary>
public class DocumentRepository : IDocumentRepository
{
    private readonly DocumentDbContext _context;

    public DocumentRepository(DocumentDbContext context)
    {
        _context = context;
    }

    public async Task<Document> AddDocumentAsync(Document document)
    {
        _context.Documents.Add(document);
        await _context.SaveChangesAsync();
        return document;
    }

    public async Task<IEnumerable<Document>> GetDocumentsByShipmentAsync(Guid shipmentId)
    {
        return await _context.Documents.Where(d => d.ShipmentId == shipmentId).ToListAsync();
    }

    public async Task<DeliveryProof> AddDeliveryProofAsync(DeliveryProof proof)
    {
        _context.DeliveryProofs.Add(proof);
        await _context.SaveChangesAsync();
        return proof;
    }

    public async Task<Document?> GetDocumentAsync(Guid id)
    {
        return await _context.Documents.FindAsync(id);
    }

    public async Task<IEnumerable<Document>> GetDocumentsByCustomerAsync(Guid customerId)
    {
        return await _context.Documents.Where(d => d.CustomerId == customerId).ToListAsync();
    }

    public async Task UpdateDocumentAsync(Document document)
    {
        _context.Documents.Update(document);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteDocumentAsync(Document document)
    {
        _context.Documents.Remove(document);
        await _context.SaveChangesAsync();
    }
    public async Task<DeliveryProof?> GetDeliveryProofAsync(Guid shipmentId)
    {
        return await _context.DeliveryProofs
            .FirstOrDefaultAsync(d => d.ShipmentId == shipmentId);
    }
}
