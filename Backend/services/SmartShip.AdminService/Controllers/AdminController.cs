using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Models;
using SmartShip.AdminService.Services;

namespace SmartShip.AdminService.Controllers;

[ApiController]
[Route("api")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    //  DASHBOARD
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var hubs = await _adminService.GetHubsAsync();
        var exceptions = await _adminService.GetOpenExceptionsAsync();

        return Ok(new
        {
            totalHubs = hubs.Count(),
            openExceptions = exceptions.Count()
        });
    }

    [HttpGet("statistics")]
    public IActionResult GetStatistics()
    {
        return Ok(new
        {
            revenue = 150000,
            shipmentsHandled = 10500,
            activeUsers = 1200
        });
    }

    // SHIPMENTS (MOCK)
    [HttpGet("shipments")]
    public IActionResult GetShipments()
        => Ok(new[] { new { shipmentId = Guid.NewGuid(), status = "InTransit" } });

    [HttpGet("shipments/{id}")]
    public IActionResult GetShipmentById(Guid id)
        => Ok(new { shipmentId = id, status = "InTransit" });

    [HttpGet("shipments/hub/{hubId}")]
    public IActionResult GetHubShipments(Guid hubId)
        => Ok(new[] { new { shipmentId = Guid.NewGuid(), hubId } });

    // EXCEPTIONS
    [HttpGet("exceptions")]
    public async Task<IActionResult> GetExceptions()
        => Ok(await _adminService.GetOpenExceptionsAsync());

    [HttpGet("exceptions/all")]
    public async Task<IActionResult> GetAllExceptions()
        => Ok(await _adminService.GetAllExceptionsAsync());

    [HttpGet("exceptions/resolved")]
    public async Task<IActionResult> GetResolvedExceptions()
        => Ok(await _adminService.GetResolvedExceptionsAsync());

    [HttpPut("shipments/{id}/resolve")]
    public async Task<IActionResult> Resolve(Guid id, [FromBody] ResolveExceptionRequest request)
    {
        await _adminService.ResolveExceptionAsync(id, request);
        return NoContent();
    }

    [HttpPut("shipments/{id}/delay")]
    public async Task<IActionResult> Delay(Guid id, [FromBody] DelayShipmentRequest request)
    {
        await _adminService.DelayExceptionAsync(id, request);
        return NoContent();
    }

    [HttpPut("shipments/{id}/return")]
    public async Task<IActionResult> Return(Guid id, [FromBody] ReturnShipmentRequest request)
    {
        await _adminService.ReturnExceptionAsync(id, request);
        return NoContent();
    }

    // HUBS
    [HttpGet("hubs")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHubs()
        => Ok(await _adminService.GetHubsAsync());

    [HttpGet("hubs/{id}")]
    public async Task<IActionResult> GetHubById(Guid id)
        => Ok(await _adminService.GetHubByIdAsync(id));

    [HttpPost("hubs")]
    public async Task<IActionResult> CreateHub([FromBody] HubDto request)
        => Ok(await _adminService.CreateHubAsync(request));

    [HttpPut("hubs/{id}")]
    public async Task<IActionResult> UpdateHub(Guid id, [FromBody] HubDto request)
    {
        await _adminService.UpdateHubAsync(id, request);
        return NoContent();
    }

    [HttpDelete("hubs/{id}")]
    public async Task<IActionResult> DeleteHub(Guid id)
    {
        await _adminService.DeleteHubAsync(id);
        return NoContent();
    }

    // LOCATIONS
    [HttpGet("locations")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLocations()
        => Ok(await _adminService.GetAllLocationsAsync());

    [HttpPost("locations")]
    public async Task<IActionResult> CreateLocation([FromBody] LocationDto request)
        => Ok(await _adminService.CreateLocationAsync(request));

    [HttpPut("locations/{id}")]
    public async Task<IActionResult> UpdateLocation(Guid id, [FromBody] LocationDto request)
    {
        await _adminService.UpdateLocationAsync(id, request);
        return NoContent();
    }

    [HttpDelete("locations/{id}")]
    public async Task<IActionResult> DeleteLocation(Guid id)
    {
        await _adminService.DeleteLocationAsync(id);
        return NoContent();
    }

    // REPORTS
    [HttpGet("reports")]
    public async Task<IActionResult> GetReports()
        => Ok(await _adminService.GetAllReportsAsync());

    [HttpGet("reports/{type}")]
    private async Task<IActionResult> GetSpecificReport(string type)
    {
        var report = await _adminService.GetReportByTypeAsync(type);

        if (report != null) return Ok(report);

        return Ok(new Report
        {
            ReportId = Guid.NewGuid(),
            ReportType = type,
            GeneratedAt = DateTime.UtcNow,
            DataJson = "{}"
        });
    }

    [HttpGet("reports/shipment-performance")]
    public async Task<IActionResult> ShipmentPerformance()
        => await GetSpecificReport("ShipmentPerformance");

    [HttpGet("reports/delivery-sla")]
    public async Task<IActionResult> DeliverySla()
        => await GetSpecificReport("DeliverySLA");

    [HttpGet("reports/revenue")]
    public async Task<IActionResult> Revenue()
        => await GetSpecificReport("Revenue");

    [HttpGet("reports/hub-performance")]
    public async Task<IActionResult> HubPerformance()
        => await GetSpecificReport("HubPerformance");
}