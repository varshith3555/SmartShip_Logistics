using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Models;

namespace SmartShip.AdminService.Services;

/// <summary>
/// Business logic abstraction for admin operations (hubs, locations, exceptions, reports).
/// </summary>
public interface IAdminService
{
    Task<Hub> CreateHubAsync(HubDto hubDto);
    Task<IEnumerable<Hub>> GetHubsAsync();
    Task<Hub?> GetHubByIdAsync(Guid hubId);
    Task UpdateHubAsync(Guid hubId, HubDto request);
    Task DeleteHubAsync(Guid hubId);

    Task<IEnumerable<ShipmentException>> GetAllExceptionsAsync();
    Task<IEnumerable<ShipmentException>> GetOpenExceptionsAsync();
    Task<IEnumerable<ShipmentException>> GetResolvedExceptionsAsync();
    Task ResolveExceptionAsync(Guid shipmentId, ResolveExceptionRequest request);
    Task DelayExceptionAsync(Guid shipmentId, DelayShipmentRequest request);
    Task ReturnExceptionAsync(Guid shipmentId, ReturnShipmentRequest request);

    Task<Location> CreateLocationAsync(LocationDto dto);
    Task<IEnumerable<Location>> GetAllLocationsAsync();
    Task<Location?> GetLocationByIdAsync(Guid locationId);
    Task UpdateLocationAsync(Guid locationId, LocationDto request);
    Task DeleteLocationAsync(Guid locationId);

    Task<IEnumerable<Report>> GetAllReportsAsync();
    Task<Report?> GetReportByTypeAsync(string type);

    Task<Report> CreateReportAsync(Report report);

    Task ReportCustomerIssueAsync(Guid shipmentId, string message);
}
