namespace SmartShip.AdminService.Models;

/// <summary>
/// Hub entity representing a logistics hub and its capacity.
/// </summary>
public class Hub
{
    public Guid HubId { get; set; }
    public string HubName { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public int Capacity { get; set; }
    
    public Location Location { get; set; } = null!;
}
