namespace SmartShip.AdminService.Models;

/// <summary>
/// Tracks shipment exceptions (delay/return/etc.) and their resolution status.
/// </summary>
public class ShipmentException
{
    public Guid ExceptionId { get; set; }
    public Guid ShipmentId { get; set; }
    public string Type { get; set; } = string.Empty; // Delay, Damage, Lost
    public string Description { get; set; } = string.Empty;
    public string Status { get; set; } = "OPEN"; // OPEN, RESOLVED
    public DateTime CreatedAt { get; set; }
}
