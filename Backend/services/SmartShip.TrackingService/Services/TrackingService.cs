using SmartShip.TrackingService.DTOs;
using SmartShip.TrackingService.Repositories;

namespace SmartShip.TrackingService.Services;

public class TrackingService : ITrackingService
{
    private readonly ITrackingRepository _repository;

    public TrackingService(ITrackingRepository repository)
    {
        _repository = repository;
    }

    // Timeline (already correct)
    public async Task<TrackingResponseDto?> GetTrackingTimelineAsync(string trackingNumber)
    {
        var status = await _repository.GetStatusAsync(trackingNumber);
        if (status == null) return null;

        var history = await _repository.GetHistoryAsync(trackingNumber);

        return new TrackingResponseDto
        {
            TrackingNumber = status.TrackingNumber,
            CurrentStatus = status.CurrentStatus,
            // Keep API values in UTC; frontend formats to IST.
            LastUpdatedAt = DateTime.SpecifyKind(status.UpdatedAt, DateTimeKind.Utc),
            History = history.Select(h => new TrackingHistoryDto
            {
                Status = h.Status,
                Location = h.Location,
                Timestamp = DateTime.SpecifyKind(h.Timestamp, DateTimeKind.Utc),
                Remarks = h.Remarks
            }).ToList()
        };
    }

    // Create event
    public async Task<TrackingHistoryDto> CreateEventAsync(CreateTrackingEventRequest request)
    {
        var history = new Models.TrackingHistory
        {
            TrackingId = Guid.NewGuid(),
            TrackingNumber = request.TrackingNumber,
            Status = request.Status,
            Location = request.Location,
            Remarks = request.Remarks,
            Timestamp = DateTime.UtcNow
        };

        await _repository.AddHistoryAsync(history);

        // Update current status
        await _repository.UpsertStatusAsync(new Models.ShipmentStatus
        {
            TrackingNumber = request.TrackingNumber,
            CurrentStatus = request.Status,
            UpdatedAt = DateTime.UtcNow
        });

        return new TrackingHistoryDto
        {
            Status = history.Status,
            Location = history.Location,
            Remarks = history.Remarks,
            Timestamp = history.Timestamp
        };
    }

    // Update event
    public async Task UpdateEventAsync(Guid historyId, UpdateTrackingEventRequest request)
    {
        var history = await _repository.GetHistoryByIdAsync(historyId)
            ?? throw new KeyNotFoundException("History event not found");

        history.Status = request.Status;
        history.Location = request.Location;
        history.Remarks = request.Remarks;

        await _repository.UpdateHistoryAsync(history);
    }

    // Delete event
    public async Task DeleteEventAsync(Guid historyId)
    {
        await _repository.DeleteHistoryAsync(historyId);
    }

    // Update location
    public async Task UpdateLocationAsync(PostLocationRequest request)
    {
        var history = new Models.TrackingHistory
        {
            TrackingId = Guid.NewGuid(),
            TrackingNumber = request.TrackingNumber,
            Status = "LocationUpdate",
            Location = request.CurrentLocation,
            Remarks = "Location updated automatically",
            Timestamp = DateTime.UtcNow
        };

        await _repository.AddHistoryAsync(history);
    }

    // Update status
    public async Task UpdateStatusAsync(string trackingNumber, UpdateStatusRequest request)
    {
        var status = new Models.ShipmentStatus
        {
            TrackingNumber = trackingNumber,
            CurrentStatus = request.NewStatus,
            UpdatedAt = DateTime.UtcNow
        };

        await _repository.UpsertStatusAsync(status);

        await _repository.AddHistoryAsync(new Models.TrackingHistory
        {
            TrackingId = Guid.NewGuid(),
            TrackingNumber = trackingNumber,
            Status = request.NewStatus,
            Location = "System",
            Timestamp = DateTime.UtcNow,
            Remarks = "Status Updated"
        });
    }

    // FIXED: consistent return type
    public async Task<string> GetCurrentStatusAsync(string trackingNumber)
    {
        var status = await _repository.GetStatusAsync(trackingNumber);
        return status?.CurrentStatus ?? "Not Found";
    }
}