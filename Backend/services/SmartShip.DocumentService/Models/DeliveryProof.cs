namespace SmartShip.DocumentService.Models;

public class DeliveryProof
{
    public Guid ProofId { get; set; }
    public Guid ShipmentId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string SignatureUrl { get; set; } = string.Empty;
    public DateTime DeliveredAt { get; set; }
}
