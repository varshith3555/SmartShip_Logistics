using SmartShip.ShipmentService.Models;

namespace SmartShip.ShipmentService.DTOs;

public class AddressDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
}

public class ShipmentItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Weight { get; set; }
}

public class CreateShipmentRequest
{
    public AddressDto SenderAddress { get; set; } = null!;
    public AddressDto ReceiverAddress { get; set; } = null!;
    public List<ShipmentItemDto> Items { get; set; } = new();
}

public class UpdateShipmentStatusRequest
{
    public string Status { get; set; } = string.Empty;
}

public class SchedulePickupRequest
{
    public DateTime ScheduledDate { get; set; }
}
