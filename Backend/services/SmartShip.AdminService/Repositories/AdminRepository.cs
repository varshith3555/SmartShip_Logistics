using Microsoft.EntityFrameworkCore;
using SmartShip.AdminService.Data;
using SmartShip.AdminService.Models;

namespace SmartShip.AdminService.Repositories;

public class AdminRepository : IAdminRepository
{
    private readonly AdminDbContext _context;

    public AdminRepository(AdminDbContext context)
    {
        _context = context;
    }

    public async Task<Hub> CreateHubAsync(Hub hub)
    {
        _context.Hubs.Add(hub);
        await _context.SaveChangesAsync();
        return hub;
    }

    public async Task<IEnumerable<Hub>> GetAllHubsAsync()
    {
        return await _context.Hubs.Include(h => h.Location).ToListAsync();
    }

    public async Task<ShipmentException> AddExceptionAsync(ShipmentException ex)
    {
        _context.ShipmentExceptions.Add(ex);
        await _context.SaveChangesAsync();
        return ex;
    }

    public async Task<IEnumerable<ShipmentException>> GetOpenExceptionsAsync()
    {
        return await _context.ShipmentExceptions
            .Where(e => e.Status != null && (e.Status == "OPEN" || e.Status == "Open"))
            .ToListAsync();
    }

    public async Task<IEnumerable<ShipmentException>> GetResolvedExceptionsAsync()
    {
        return await _context.ShipmentExceptions
            .Where(e => e.Status != null && (e.Status == "RESOLVED" || e.Status == "Resolved"))
            .ToListAsync();
    }

    public async Task ResolveExceptionAsync(Guid exceptionId)
    {
        var ex = await _context.ShipmentExceptions.FindAsync(exceptionId);
        if (ex != null)
        {
            ex.Status = "RESOLVED";
            await _context.SaveChangesAsync();
        }
    }

    public async Task<Hub?> GetHubByIdAsync(Guid hubId) => await _context.Hubs.Include(h => h.Location).FirstOrDefaultAsync(h => h.HubId == hubId);
    public async Task UpdateHubAsync(Hub hub)
    {
        _context.Hubs.Update(hub);
        await _context.SaveChangesAsync();
    }
    public async Task DeleteHubAsync(Hub hub)
    {
        _context.Hubs.Remove(hub);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<ShipmentException>> GetAllExceptionsAsync() => await _context.ShipmentExceptions.ToListAsync();
    public async Task<ShipmentException?> GetExceptionByShipmentIdAsync(Guid shipmentId)
        => await _context.ShipmentExceptions.FirstOrDefaultAsync(e => e.ShipmentId == shipmentId && e.Status != null && (e.Status == "OPEN" || e.Status == "Open"));
    public async Task UpdateExceptionAsync(ShipmentException ex)
    {
        _context.ShipmentExceptions.Update(ex);
        await _context.SaveChangesAsync();
    }

    public async Task<Location> CreateLocationAsync(Location location)
    {
        _context.Locations.Add(location);
        await _context.SaveChangesAsync();
        return location;
    }
    public async Task<IEnumerable<Location>> GetAllLocationsAsync() => await _context.Locations.ToListAsync();
    public async Task<Location?> GetLocationByIdAsync(Guid locationId) => await _context.Locations.FindAsync(locationId);
    public async Task UpdateLocationAsync(Location location)
    {
        _context.Locations.Update(location);
        await _context.SaveChangesAsync();
    }
    public async Task DeleteLocationAsync(Location location)
    {
        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<Report>> GetAllReportsAsync() => await _context.Reports.ToListAsync();
    public async Task<Report?> GetReportByTypeAsync(string type) => await _context.Reports.OrderByDescending(r => r.GeneratedAt).FirstOrDefaultAsync(r => r.ReportType == type);
}
