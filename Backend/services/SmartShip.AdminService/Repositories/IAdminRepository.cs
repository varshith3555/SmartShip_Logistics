using SmartShip.AdminService.Models;

namespace SmartShip.AdminService.Repositories;

public interface IAdminRepository
{
    Task<Hub> CreateHubAsync(Hub hub);
    Task<IEnumerable<Hub>> GetAllHubsAsync();
    Task<Hub?> GetHubByIdAsync(Guid hubId);
    Task UpdateHubAsync(Hub hub);
    Task DeleteHubAsync(Hub hub);

    Task<ShipmentException> AddExceptionAsync(ShipmentException ex);
    Task<IEnumerable<ShipmentException>> GetOpenExceptionsAsync();
    Task<IEnumerable<ShipmentException>> GetResolvedExceptionsAsync();
    Task<IEnumerable<ShipmentException>> GetAllExceptionsAsync();
    Task<ShipmentException?> GetExceptionByShipmentIdAsync(Guid shipmentId);
    Task UpdateExceptionAsync(ShipmentException ex);
    Task ResolveExceptionAsync(Guid exceptionId);

    Task<Location> CreateLocationAsync(Location location);
    Task<IEnumerable<Location>> GetAllLocationsAsync();
    Task<Location?> GetLocationByIdAsync(Guid locationId);
    Task UpdateLocationAsync(Location location);
    Task DeleteLocationAsync(Location location);

    Task<IEnumerable<Report>> GetAllReportsAsync();
    Task<Report?> GetReportByTypeAsync(string type);
}
