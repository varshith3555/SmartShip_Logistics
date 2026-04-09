using System.ComponentModel.DataAnnotations;

namespace SmartShip.TrackingService.DTOs;

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

public class UpdateTrackingEventRequest
{
    [Required]
    public string Status { get; set; } = string.Empty;
    [Required]
    public string Location { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
}

public class PostLocationRequest
{
    [Required]
    public string TrackingNumber { get; set; } = string.Empty;
    [Required]
    public string CurrentLocation { get; set; } = string.Empty;
}

public class UpdateStatusRequest
{
    [Required]
    public string NewStatus { get; set; } = string.Empty;
}
