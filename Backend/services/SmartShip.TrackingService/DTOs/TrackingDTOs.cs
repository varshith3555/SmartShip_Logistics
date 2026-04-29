using SmartShip.TrackingService.Models;

namespace SmartShip.TrackingService.DTOs;

/// <summary>
/// Response DTO for tracking timeline queries.
/// </summary>
public class TrackingResponseDto
{
    public string TrackingNumber { get; set; } = string.Empty;
    public string CurrentStatus { get; set; } = string.Empty;
    public DateTime LastUpdatedAt { get; set; }
    public List<TrackingHistoryDto> History { get; set; } = new();
}

/// <summary>
/// DTO describing a single tracking history entry.
/// </summary>
public class TrackingHistoryDto
{
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Remarks { get; set; } = string.Empty;
}
