using SmartShip.ShipmentService.Models;

namespace SmartShip.ShipmentService.Repositories;

public interface IShipmentRepository
{
    Task<Shipment?> GetByIdAsync(Guid id);
    Task<Shipment?> GetByTrackingNumberAsync(string trackingNumber);
    Task<IEnumerable<Shipment>> GetAllAsync();
    Task<IEnumerable<Shipment>> GetByUserIdAsync(Guid userId);
    Task<Shipment> CreateAsync(Shipment shipment);
    Task UpdateAsync(Shipment shipment);
    Task DeleteAsync(Shipment shipment);
    Task<ShipmentItem?> GetItemByIdAsync(Guid itemId);
    Task DeleteItemAsync(ShipmentItem item);
}
