using SmartShip.DocumentService.Models;
using SmartShip.DocumentService.Repositories;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace SmartShip.DocumentService.Services;

public class DocumentService : IDocumentService
{
    private readonly IDocumentRepository _repository;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<DocumentService> _logger;
    private readonly string? _publicBaseUrl;

    public DocumentService(IDocumentRepository repository, IWebHostEnvironment environment, ILogger<DocumentService> logger, IConfiguration configuration)
    {
        _repository = repository;
        _environment = environment;
        _logger = logger;
        _publicBaseUrl = configuration["AppSettings:BaseUrl"]?.TrimEnd('/');
    }

    private string ToPublicUrl(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return relativePath;

        if (string.IsNullOrWhiteSpace(_publicBaseUrl))
            return relativePath;

        var normalized = relativePath.StartsWith('/') ? relativePath : "/" + relativePath;
        return _publicBaseUrl + normalized;
    }

    private async Task<string> SaveFileAsync(IFormFile file, string subFolder)
    {
        var uploadsFolder = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads", subFolder);
        if (!Directory.Exists(uploadsFolder))
            Directory.CreateDirectory(uploadsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(fileStream);
        }

        var relativeUrl = $"/uploads/{subFolder}/{uniqueFileName}";
        return ToPublicUrl(relativeUrl);
    }

    public async Task<Document> UploadDocumentAsync(Guid shipmentId, Guid customerId, IFormFile file, string fileType)
    {
        var fileUrl = await SaveFileAsync(file, "documents");

        var document = new Document
        {
            DocumentId = Guid.NewGuid(),
            ShipmentId = shipmentId,
            CustomerId = customerId,
            FileName = file.FileName,
            FileType = fileType,
            FileUrl = fileUrl,
            UploadedAt = DateTime.UtcNow
        };

        var created = await _repository.AddDocumentAsync(document);
        _logger.LogInformation("Document uploaded for Shipment {ShipmentId}", shipmentId);
        return created;
    }

    public async Task<IEnumerable<Document>> GetShipmentDocumentsAsync(Guid shipmentId)
    {
        _logger.LogInformation("Documents retrieved for Shipment {ShipmentId}", shipmentId);
        return await _repository.GetDocumentsByShipmentAsync(shipmentId);
    }

    public async Task<DeliveryProof> UploadDeliveryProofAsync(Guid shipmentId, IFormFile image, IFormFile signature)
    {
        var imageUrl = await SaveFileAsync(image, "proofs");
        var sigUrl = await SaveFileAsync(signature, "proofs");

        var proof = new DeliveryProof
        {
            ProofId = Guid.NewGuid(),
            ShipmentId = shipmentId,
            ImageUrl = imageUrl,
            SignatureUrl = sigUrl,
            DeliveredAt = DateTime.UtcNow
        };

        var created = await _repository.AddDeliveryProofAsync(proof);
        _logger.LogInformation("Delivery proof uploaded for Shipment {ShipmentId}", shipmentId);
        return created;
    }

    public async Task<DeliveryProof?> GetDeliveryProofAsync(Guid shipmentId)
    {
        _logger.LogInformation("Delivery proof retrieved for Shipment {ShipmentId}", shipmentId);
        return await _repository.GetDeliveryProofAsync(shipmentId);
    }

    public async Task<Document?> GetDocumentAsync(Guid documentId)
    {
        _logger.LogInformation("Document retrieved with ID {DocumentId}", documentId);
        return await _repository.GetDocumentAsync(documentId);
    }

    public async Task<IEnumerable<Document>> GetCustomerDocumentsAsync(Guid customerId)
    {
        return await _repository.GetDocumentsByCustomerAsync(customerId);
    }

    public async Task UpdateDocumentAsync(Guid documentId, string newFileType)
    {
        var doc = await _repository.GetDocumentAsync(documentId);
        if (doc != null)
        {
            doc.FileType = newFileType;
            await _repository.UpdateDocumentAsync(doc);
        }
    }

    public async Task DeleteDocumentAsync(Guid documentId)
    {
        var doc = await _repository.GetDocumentAsync(documentId);
        if (doc != null)
        {
            var fileUrl = doc.FileUrl ?? string.Empty;
            var relative = _publicBaseUrl != null && fileUrl.StartsWith(_publicBaseUrl, StringComparison.OrdinalIgnoreCase)
                ? fileUrl.Substring(_publicBaseUrl.Length).TrimStart('/')
                : fileUrl.TrimStart('/');

            var filePath = Path.Combine(_environment.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), relative);
            if (File.Exists(filePath)) File.Delete(filePath);

            await _repository.DeleteDocumentAsync(doc);
        }
    }
}
