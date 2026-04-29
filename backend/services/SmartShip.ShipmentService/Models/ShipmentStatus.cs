namespace SmartShip.ShipmentService.Models;

/// <summary>
/// Enumerates supported shipment lifecycle statuses.
/// </summary>
public enum ShipmentStatus
{
    DRAFT,
    BOOKED,
    PICKED_UP,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    DELAYED,
    FAILED,
    RETURNED,
    CANCELLED
}
