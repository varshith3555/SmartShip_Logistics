using SmartShip.TrackingService.DTOs;

namespace SmartShip.TrackingService.Services;

public interface ITrackingService
{
    Task<TrackingResponseDto?> GetTrackingTimelineAsync(string trackingNumber);

    Task<TrackingHistoryDto> CreateEventAsync(CreateTrackingEventRequest request);

    Task UpdateEventAsync(Guid historyId, UpdateTrackingEventRequest request);

    Task DeleteEventAsync(Guid historyId);

    Task UpdateLocationAsync(PostLocationRequest request);

    Task UpdateStatusAsync(string trackingNumber, UpdateStatusRequest request);

    // IMPORTANT FIX (used in controller)
    Task<string> GetCurrentStatusAsync(string trackingNumber);
}