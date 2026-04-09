namespace SmartShip.ShipmentService.Models;

public enum ShipmentStatus
{
    CREATED,
    BOOKED,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    DELAYED,
    CANCELLED
}
