namespace SmartShip.ShipmentService.Models;

/// <summary>
/// Address entity used for sender/receiver shipment addresses.
/// </summary>
public class Address
{
    public Guid AddressId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Street { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
}
