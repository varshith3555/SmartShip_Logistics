using System.ComponentModel.DataAnnotations;

namespace SmartShip.AdminService.DTOs;

public class HubDto
{
    public string HubName { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public int Capacity { get; set; }
}

public class ResolveExceptionRequest
{
    public string ResolutionDetails  { get; set; } = string.Empty;
}

public class DelayShipmentRequest
{
    [Required]
    public int DelayedByHours { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class ReturnShipmentRequest
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}
