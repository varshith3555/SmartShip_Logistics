using System.ComponentModel.DataAnnotations;

namespace SmartShip.AdminService.DTOs;

/// <summary>
/// Request payload for creating/updating hubs.
/// </summary>
public class HubDto
{
    public string HubName { get; set; } = string.Empty;
    public Guid LocationId { get; set; }
    public int Capacity { get; set; }
}

/// <summary>
/// Request payload for resolving a shipment exception.
/// </summary>
public class ResolveExceptionRequest
{
    public string ResolutionDetails  { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for delaying a shipment (creates/updates an exception).
/// </summary>
public class DelayShipmentRequest
{
    [Required]
    public int DelayedByHours { get; set; }
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for returning a shipment (creates/updates an exception).
/// </summary>
public class ReturnShipmentRequest
{
    [Required]
    public string Reason { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for a customer to report an issue with a shipment.
/// </summary>
public class ReportIssueRequest
{
    [Required]
    public Guid ShipmentId { get; set; }

    public string Message { get; set; } = string.Empty;
}
