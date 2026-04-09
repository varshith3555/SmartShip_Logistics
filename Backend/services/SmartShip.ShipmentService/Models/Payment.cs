namespace SmartShip.ShipmentService.Models;

public class Payment
{
    public Guid PaymentId { get; set; }
    public Guid ShipmentId { get; set; }
    public decimal Amount { get; set; }
    public string PaymentStatus { get; set; } = "Pending"; // Pending, Paid, Failed
    public DateTime? PaymentDate { get; set; }
    
    public Shipment Shipment { get; set; } = null!;
}
