using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Models;
using SmartShip.AdminService.Repositories;
using Microsoft.Extensions.Logging;

namespace SmartShip.AdminService.Services;

public class AdminService : IAdminService
{
    private readonly IAdminRepository _repository;
    private readonly ILogger<AdminService> _logger;

    public AdminService(IAdminRepository repository, ILogger<AdminService> logger)
    {
        _repository = repository;
        _logger = logger;
    }

    public async Task<Hub> CreateHubAsync(HubDto hubDto)
    {
        var hub = new Hub
        {
            HubId = Guid.NewGuid(),
            HubName = hubDto.HubName,
            Capacity = hubDto.Capacity,
            LocationId = hubDto.LocationId
        };
        var created = await _repository.CreateHubAsync(hub);
        _logger.LogInformation("Hub created with HubId {HubId}", created.HubId);
        return created;
    }

    public async Task<IEnumerable<Hub>> GetHubsAsync() => await _repository.GetAllHubsAsync();

    public async Task<IEnumerable<ShipmentException>> GetOpenExceptionsAsync() => await _repository.GetOpenExceptionsAsync();

    public async Task<IEnumerable<ShipmentException>> GetResolvedExceptionsAsync() => await _repository.GetResolvedExceptionsAsync();

    public async Task ResolveExceptionAsync(Guid shipmentId, ResolveExceptionRequest request)
    {
        var ex = await _repository.GetExceptionByShipmentIdAsync(shipmentId);
        if (ex != null)
        {
            ex.Status = "RESOLVED";
            ex.Description += $" | Resolved: {request.ResolutionDetails}";
            await _repository.UpdateExceptionAsync(ex);
            _logger.LogInformation("Shipment exception resolved for ShipmentId {ShipmentId}", shipmentId);
        }
    }

    public async Task DelayExceptionAsync(Guid shipmentId, DelayShipmentRequest request)
    {
        var ex = await _repository.GetExceptionByShipmentIdAsync(shipmentId);
        if (ex == null)
        {
            ex = new ShipmentException { ExceptionId = Guid.NewGuid(), ShipmentId = shipmentId, Type = "Delay", CreatedAt = DateTime.UtcNow, Status = "OPEN" };
            await _repository.AddExceptionAsync(ex);
            _logger.LogInformation("Delay exception created for ShipmentId {ShipmentId}", shipmentId);
        }
        ex.Description += $" | Delayed by {request.DelayedByHours}h. Reason: {request.Reason}";
        await _repository.UpdateExceptionAsync(ex);
        _logger.LogInformation("Delay exception updated for ShipmentId {ShipmentId}", shipmentId);
    }

    public async Task ReturnExceptionAsync(Guid shipmentId, ReturnShipmentRequest request)
    {
        var ex = await _repository.GetExceptionByShipmentIdAsync(shipmentId);
        if (ex == null)
        {
            ex = new ShipmentException { ExceptionId = Guid.NewGuid(), ShipmentId = shipmentId, Type = "Returned", CreatedAt = DateTime.UtcNow, Status = "OPEN" };
            await _repository.AddExceptionAsync(ex);
            _logger.LogInformation("Return exception created for ShipmentId {ShipmentId}", shipmentId);
        }
        ex.Description += $" | Returned. Reason: {request.Reason}";
        await _repository.UpdateExceptionAsync(ex);
        _logger.LogInformation("Return exception updated for ShipmentId {ShipmentId}", shipmentId);
    }

    public async Task<Hub?> GetHubByIdAsync(Guid hubId) => await _repository.GetHubByIdAsync(hubId);
    public async Task UpdateHubAsync(Guid hubId, HubDto request)
    {
        var hub = await _repository.GetHubByIdAsync(hubId) ?? throw new KeyNotFoundException();
        hub.HubName = request.HubName;
        hub.Capacity = request.Capacity;
        hub.LocationId = request.LocationId;
        await _repository.UpdateHubAsync(hub);
        _logger.LogInformation("Hub updated with HubId {HubId}", hubId);
    }
    public async Task DeleteHubAsync(Guid hubId)
    {
        var hub = await _repository.GetHubByIdAsync(hubId) ?? throw new KeyNotFoundException();
        await _repository.DeleteHubAsync(hub);
        _logger.LogInformation("Hub deleted with HubId {HubId}", hubId);
    }

    public async Task<IEnumerable<ShipmentException>> GetAllExceptionsAsync() => await _repository.GetAllExceptionsAsync();

    public async Task<Location> CreateLocationAsync(LocationDto dto)
    {
        var l = new Location { LocationId = Guid.NewGuid(), City = dto.City, State = dto.State, Country = dto.Country, Pincode = dto.Pincode };
        var created = await _repository.CreateLocationAsync(l);
        _logger.LogInformation("Location created with LocationId {LocationId}", created.LocationId);
        return created;
    }
    public async Task<IEnumerable<Location>> GetAllLocationsAsync() => await _repository.GetAllLocationsAsync();
    public async Task<Location?> GetLocationByIdAsync(Guid locationId) => await _repository.GetLocationByIdAsync(locationId);
    public async Task UpdateLocationAsync(Guid locationId, LocationDto request)
    {
        var l = await _repository.GetLocationByIdAsync(locationId) ?? throw new KeyNotFoundException();
        l.City = request.City; l.State = request.State; l.Country = request.Country; l.Pincode = request.Pincode;
        await _repository.UpdateLocationAsync(l);
        _logger.LogInformation("Location updated with LocationId {LocationId}", locationId);
    }
    public async Task DeleteLocationAsync(Guid locationId)
    {
        var l = await _repository.GetLocationByIdAsync(locationId) ?? throw new KeyNotFoundException();
        await _repository.DeleteLocationAsync(l);
        _logger.LogInformation("Location deleted with LocationId {LocationId}", locationId);
    }

    public async Task<IEnumerable<Report>> GetAllReportsAsync() => await _repository.GetAllReportsAsync();
    public async Task<Report?> GetReportByTypeAsync(string type) => await _repository.GetReportByTypeAsync(type);
}
