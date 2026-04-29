using SmartShip.ShipmentService.Models;
using System.ComponentModel.DataAnnotations;

namespace SmartShip.ShipmentService.DTOs;

/// <summary>
/// Address payload used in shipment requests.
/// </summary>
public class AddressDto
{
    [Required(ErrorMessage = "Name is required")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Phone is required")]
    [StringLength(10, MinimumLength = 10, ErrorMessage = "Phone must be 10 digits")]
    [RegularExpression(@"^\d{10}$", ErrorMessage = "Phone must be 10 digits")]
    public string Phone { get; set; } = string.Empty;

    [Required(ErrorMessage = "Street is required")]
    public string Street { get; set; } = string.Empty;

    [Required(ErrorMessage = "City is required")]
    public string City { get; set; } = string.Empty;

    [Required(ErrorMessage = "State is required")]
    public string State { get; set; } = string.Empty;

    [Required(ErrorMessage = "Country is required")]
    public string Country { get; set; } = string.Empty;

    [Required(ErrorMessage = "Pincode is required")]
    [StringLength(6, MinimumLength = 6, ErrorMessage = "Pincode must be 6 digits")]
    [RegularExpression(@"^\d{6}$", ErrorMessage = "Pincode must be 6 digits")]
    public string Pincode { get; set; } = string.Empty;
}

/// <summary>
/// Item/package payload used when creating shipments.
/// </summary>
public class ShipmentItemDto
{
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Weight { get; set; }
}

/// <summary>
/// Request payload to create a new shipment.
/// </summary>
public class CreateShipmentRequest
{
    public AddressDto SenderAddress { get; set; } = null!;
    public AddressDto ReceiverAddress { get; set; } = null!;
    public List<ShipmentItemDto> Items { get; set; } = new();
}

/// <summary>
/// Request payload to update a shipment status.
/// </summary>
public class UpdateShipmentStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public Guid? HubId { get; set; }
}

/// <summary>
/// Request payload to schedule (or update) a pickup.
/// </summary>
public class SchedulePickupRequest
{
    public DateTime ScheduledDate { get; set; }
}
