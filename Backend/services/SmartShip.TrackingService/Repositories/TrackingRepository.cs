using Microsoft.EntityFrameworkCore;
using SmartShip.TrackingService.Data;
using SmartShip.TrackingService.Models;

namespace SmartShip.TrackingService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="ITrackingRepository"/>.
/// </summary>
public class TrackingRepository : ITrackingRepository
{
    private readonly TrackingDbContext _context;

    public TrackingRepository(TrackingDbContext context)
    {
        _context = context;
    }

    public async Task<ShipmentStatus?> GetStatusAsync(string trackingNumber)
    {
        return await _context.ShipmentStatuses.FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);
    }

    public async Task<IEnumerable<TrackingHistory>> GetHistoryAsync(string trackingNumber)
    {
        return await _context.TrackingHistories
            .Where(t => t.TrackingNumber == trackingNumber)
            .OrderByDescending(t => t.Timestamp)
            .ToListAsync();
    }

    public async Task UpsertStatusAsync(ShipmentStatus status)
    {
        var existing = await _context.ShipmentStatuses.FirstOrDefaultAsync(s => s.TrackingNumber == status.TrackingNumber);
        if (existing == null)
        {
            _context.ShipmentStatuses.Add(status);
        }
        else
        {
            existing.CurrentStatus = status.CurrentStatus;
            existing.UpdatedAt = status.UpdatedAt;
            _context.ShipmentStatuses.Update(existing);
        }
        await _context.SaveChangesAsync();
    }

    public async Task AddHistoryAsync(TrackingHistory history)
    {
        _context.TrackingHistories.Add(history);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteHistoryAsync(Guid historyId)
    {
        var history = await _context.TrackingHistories.FindAsync(historyId);
        if (history != null)
        {
            _context.TrackingHistories.Remove(history);
            await _context.SaveChangesAsync();
        }
    }

    public async Task UpdateHistoryAsync(TrackingHistory history)
    {
        _context.TrackingHistories.Update(history);
        await _context.SaveChangesAsync();
    }

    public async Task<TrackingHistory?> GetHistoryByIdAsync(Guid historyId)
    {
        return await _context.TrackingHistories.FindAsync(historyId);
    }
}
