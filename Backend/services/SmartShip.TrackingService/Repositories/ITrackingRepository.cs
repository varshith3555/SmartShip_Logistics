using SmartShip.TrackingService.Models;

namespace SmartShip.TrackingService.Repositories;

/// <summary>
/// Data-access abstraction for tracking status snapshots and history records.
/// </summary>
public interface ITrackingRepository
{
    Task<ShipmentStatus?> GetStatusAsync(string trackingNumber);
    Task<IEnumerable<TrackingHistory>> GetHistoryAsync(string trackingNumber);
    Task UpsertStatusAsync(ShipmentStatus status);
    Task AddHistoryAsync(TrackingHistory history);
    Task DeleteHistoryAsync(Guid historyId);
    Task UpdateHistoryAsync(TrackingHistory history);
    Task<TrackingHistory?> GetHistoryByIdAsync(Guid historyId);
}
