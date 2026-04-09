namespace SmartShip.AdminService.Models;

public class Location
{
    public Guid LocationId { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Pincode { get; set; } = string.Empty;
}
