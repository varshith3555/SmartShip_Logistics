namespace SmartShip.AdminService.Models;

public class Hub
{
    public Guid HubId { get; set; }
    public string HubName { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public int Capacity { get; set; }
    
    public Location Location { get; set; } = null!;
}
