using SmartShip.ShipmentService.DTOs;
using SmartShip.ShipmentService.Models;

namespace SmartShip.ShipmentService.Services;

/// <summary>
/// Business logic abstraction for shipment lifecycle operations.
/// </summary>
public interface IShipmentService
{
    Task<Shipment> CreateShipmentAsync(Guid userId, CreateShipmentRequest request);
    Task BookShipmentAsync(Guid userId, Guid shipmentId);
    Task<Shipment?> GetShipmentAsync(Guid id);
    Task<IEnumerable<Shipment>> GetCustomerShipmentsAsync(Guid userId);
    Task<IEnumerable<Shipment>> GetAllShipmentsAsync();
    Task UpdateShipmentStatusAsync(Guid id, UpdateShipmentStatusRequest request);
    Task SchedulePickupAsync(Guid id, SchedulePickupRequest request);
    Task UpdatePickupAsync(Guid id, SchedulePickupRequest request);
    Task DeleteShipmentAsync(Guid id);

    Task UpdateShipmentAsync(Guid id, UpdateShipmentRequest request);
    Task<ShipmentItem> AddPackageAsync(Guid shipmentId, AddPackageRequest request);
    Task UpdatePackageAsync(Guid packageId, UpdatePackageRequest request);
    Task DeletePackageAsync(Guid packageId);
    
    CalculateRateResponse CalculateRate(CalculateRateRequest request);
    IEnumerable<ServiceTypeDto> GetAvailableServices();
}
