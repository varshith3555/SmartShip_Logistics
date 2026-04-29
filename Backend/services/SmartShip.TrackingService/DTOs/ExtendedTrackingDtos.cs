using System.ComponentModel.DataAnnotations;

namespace SmartShip.TrackingService.DTOs;

/// <summary>
/// Request payload for creating a new tracking event.
/// </summary>
public class CreateTrackingEventRequest
{
    [Required]
    public string TrackingNumber { get; set; } = string.Empty;
    [Required]
    public string Status { get; set; } = string.Empty;
    [Required]
    public string Location { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for updating an existing tracking event.
/// </summary>
public class UpdateTrackingEventRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
    [Required]
    public string Location { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for posting a location update for a tracking number.
/// </summary>
public class PostLocationRequest
{
    [Required]
    public string TrackingNumber { get; set; } = string.Empty;
    [Required]
    public string CurrentLocation { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for changing the current shipment status.
/// </summary>
public class UpdateStatusRequest
{
    [Required]
    public string NewStatus { get; set; } = string.Empty;
}
