namespace SmartShip.ShipmentService.Models;

/// <summary>
/// Pickup scheduling details for a shipment.
/// </summary>
public class PickupDetails
{
    public Guid PickupId { get; set; }   // keep this

    public Guid ShipmentId { get; set; }
    public DateTime ScheduledDate { get; set; }
    public string PickupStatus { get; set; } = "Pending";

    public Shipment Shipment { get; set; } = null!;
}
