namespace SmartShip.DocumentService.Models;

/// <summary>
/// Document metadata record for files uploaded against shipments.
/// </summary>
public class Document
{
    public Guid DocumentId { get; set; }
    public Guid ShipmentId { get; set; }
    public Guid CustomerId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string FileUrl { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; }
}
