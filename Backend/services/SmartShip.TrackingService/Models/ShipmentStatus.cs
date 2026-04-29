namespace SmartShip.TrackingService.Models;

/// <summary>
/// Current status snapshot for a shipment tracking number.
/// </summary>
public class ShipmentStatus
{
    public Guid Id { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime UpdatedAt { get; set; }
}
