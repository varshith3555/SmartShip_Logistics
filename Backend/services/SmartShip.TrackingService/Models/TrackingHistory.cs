namespace SmartShip.TrackingService.Models;

public class TrackingHistory
{
    public Guid TrackingId { get; set; }
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Remarks { get; set; } = string.Empty;
}
