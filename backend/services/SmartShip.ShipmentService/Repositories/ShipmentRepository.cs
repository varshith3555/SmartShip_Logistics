using Microsoft.EntityFrameworkCore;
using SmartShip.ShipmentService.Data;
using SmartShip.ShipmentService.Models;

namespace SmartShip.ShipmentService.Repositories;

/// <summary>
/// EF Core implementation of <see cref="IShipmentRepository"/>.
/// </summary>
public class ShipmentRepository : IShipmentRepository
{
    private readonly ShipmentDbContext _context;

    public ShipmentRepository(ShipmentDbContext context)
    {
        _context = context;
    }

    public async Task<Shipment?> GetByIdAsync(Guid id)
    {
        return await _context.Shipments
            .Include(s => s.SenderAddress)
            .Include(s => s.ReceiverAddress)
            .Include(s => s.Items)
            .Include(s => s.PickupDetails)
            .FirstOrDefaultAsync(s => s.ShipmentId == id);
    }

    public async Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber)
    {
        return await _context.Shipments.FirstOrDefaultAsync(s => s.TrackingNumber == trackingNumber);
    }

    public async Task<IEnumerable<Shipment>> GetAllAsync()
    {
        return await _context.Shipments.ToListAsync();
    }

    public async Task<IEnumerable<Shipment>> GetByUserIdAsync(Guid userId)
    {
        return await _context.Shipments.Where(s => s.UserId == userId).ToListAsync();
    }

    public async Task<Shipment> CreateAsync(Shipment shipment)
    {
        _context.Shipments.Add(shipment);
        await _context.SaveChangesAsync();
        return shipment;
    }

    public async Task UpdateAsync(Shipment shipment)
    {
        _context.Shipments.Update(shipment);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Shipment shipment)
    {
        _context.Shipments.Remove(shipment);
        await _context.SaveChangesAsync();
    }

    public async Task<ShipmentItem?> GetItemByIdAsync(Guid itemId)
    {
        return await _context.Set<ShipmentItem>().FindAsync(itemId);
    }

    public async Task DeleteItemAsync(ShipmentItem item)
    {
        _context.Set<ShipmentItem>().Remove(item);
        await _context.SaveChangesAsync();
    }
}
