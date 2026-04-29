using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Models;
using SmartShip.AdminService.Services;
using System.Globalization;

namespace SmartShip.AdminService.Controllers;

[ApiController]
[Route("api")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public AdminController(IAdminService adminService, IHttpClientFactory httpClientFactory, IHttpContextAccessor httpContextAccessor)
    {
        _adminService = adminService;
        _httpClientFactory = httpClientFactory;
        _httpContextAccessor = httpContextAccessor;
    }

    private async Task<(int StatusCode, string Content)> ProxyToShipmentServiceAsync(HttpMethod method, string pathAndQuery)
    {
        var client = _httpClientFactory.CreateClient("ShipmentService");

        using var req = new HttpRequestMessage(method, pathAndQuery);

        var authHeader = _httpContextAccessor.HttpContext?.Request?.Headers.Authorization.ToString();
        if (!string.IsNullOrWhiteSpace(authHeader))
        {
            req.Headers.TryAddWithoutValidation("Authorization", authHeader);
        }

        using var resp = await client.SendAsync(req);
        var content = await resp.Content.ReadAsStringAsync();
        return ((int)resp.StatusCode, content);
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

    // SHIPMENTS (REAL)
    [HttpGet("shipments")]
    public async Task<IActionResult> GetShipments()
    {
        var qs = Request.QueryString.HasValue ? Request.QueryString.Value : string.Empty;
        var (statusCode, content) = await ProxyToShipmentServiceAsync(HttpMethod.Get, $"api/shipments{qs}");
        return new ContentResult { StatusCode = statusCode, ContentType = "application/json", Content = content };
    }

    [HttpGet("shipments/{id}")]
    public async Task<IActionResult> GetShipmentById(Guid id)
    {
        var (statusCode, content) = await ProxyToShipmentServiceAsync(HttpMethod.Get, $"api/shipments/{id}");
        return new ContentResult { StatusCode = statusCode, ContentType = "application/json", Content = content };
    }

    [HttpGet("shipments/hub/{hubId}")]
    public async Task<IActionResult> GetHubShipments(string hubId)
    {
        var (statusCode, content) = await ProxyToShipmentServiceAsync(HttpMethod.Get, "api/shipments");
        if (statusCode < 200 || statusCode >= 300)
        {
            return new ContentResult { StatusCode = statusCode, ContentType = "application/json", Content = content };
        }

        try
        {
            using var doc = JsonDocument.Parse(content);
            if (doc.RootElement.ValueKind != JsonValueKind.Array)
            {
                return new ContentResult { StatusCode = 200, ContentType = "application/json", Content = content };
            }

            var filtered = doc.RootElement
                .EnumerateArray()
                .Where(e => e.TryGetProperty("hubId", out var p) && p.ValueKind == JsonValueKind.String && p.GetString() == hubId)
                .Select(e => e.Clone())
                .ToList();

            return Ok(filtered);
        }
        catch
        {
            return new ContentResult { StatusCode = 200, ContentType = "application/json", Content = content };
        }
    }

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
    [AllowAnonymous]
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
    {
        var reports = (await _adminService.GetAllReportsAsync()).ToList();
        if (reports.Count == 0)
        {
            await GenerateBootstrapReportsAsync();
            reports = (await _adminService.GetAllReportsAsync()).ToList();
        }

        return Ok(reports);
    }

    private async Task GenerateBootstrapReportsAsync()
    {
        // Minimal, persisted generation so the admin UI has something real to show.
        // If shipment service is unavailable, fall back to empty data.
        var (statusCode, content) = await ProxyToShipmentServiceAsync(HttpMethod.Get, "api/shipments");

        var now = DateTime.UtcNow;
        var since = now.AddDays(-7);

        var shipments = new List<(string Status, string HubId, decimal Price, DateTime CreatedAt)>();
        if (statusCode >= 200 && statusCode < 300)
        {
            try
            {
                using var doc = JsonDocument.Parse(content);
                if (doc.RootElement.ValueKind == JsonValueKind.Array)
                {
                    foreach (var e in doc.RootElement.EnumerateArray())
                    {
                        var status = e.TryGetProperty("status", out var s) && s.ValueKind == JsonValueKind.String ? s.GetString() ?? string.Empty : string.Empty;
                        var hubId = e.TryGetProperty("hubId", out var h) && h.ValueKind == JsonValueKind.String ? h.GetString() ?? string.Empty : string.Empty;
                        var price = e.TryGetProperty("price", out var p) && p.ValueKind == JsonValueKind.Number ? p.GetDecimal() : 0m;

                        DateTime createdAt = now;
                        if (e.TryGetProperty("createdAt", out var c))
                        {
                            if (c.ValueKind == JsonValueKind.String)
                            {
                                var raw = c.GetString();
                                if (!string.IsNullOrWhiteSpace(raw))
                                {
                                    DateTime.TryParse(raw, CultureInfo.InvariantCulture, DateTimeStyles.AdjustToUniversal | DateTimeStyles.AssumeUniversal, out createdAt);
                                }
                            }
                        }

                        shipments.Add((status, hubId, price, createdAt));
                    }
                }
            }
            catch
            {
                // ignore parse errors
            }
        }

        var last7 = shipments.Where(x => x.CreatedAt >= since).ToList();

        var byStatus = last7
            .GroupBy(x => (x.Status ?? string.Empty).Trim().ToUpperInvariant())
            .ToDictionary(g => g.Key, g => g.Count());

        var total = last7.Count;
        var delivered = byStatus.TryGetValue("DELIVERED", out var d) ? d : 0;
        var delayed = byStatus.TryGetValue("DELAYED", out var dl) ? dl : 0;
        var inTransit = byStatus.TryGetValue("IN_TRANSIT", out var it) ? it : 0;
        var booked = byStatus.TryGetValue("BOOKED", out var b) ? b : 0;

        var revenue = last7.Sum(x => x.Price);

        var hubPerf = last7
            .Where(x => !string.IsNullOrWhiteSpace(x.HubId))
            .GroupBy(x => x.HubId)
            .Select(g => new { hubId = g.Key, shipments = g.Count(), delivered = g.Count(x => string.Equals(x.Status, "DELIVERED", StringComparison.OrdinalIgnoreCase)) })
            .OrderByDescending(x => x.shipments)
            .ToList();

        // Persist a small set of core reports.
        var reportsToCreate = new[]
        {
            new Report
            {
                ReportId = Guid.NewGuid(),
                ReportType = "ShipmentPerformance",
                GeneratedAt = now,
                DataJson = JsonSerializer.Serialize(new { windowDays = 7, total, byStatus })
            },
            new Report
            {
                ReportId = Guid.NewGuid(),
                ReportType = "DeliverySLA",
                GeneratedAt = now,
                DataJson = JsonSerializer.Serialize(new { windowDays = 7, total, delivered, delayed, inTransit, booked, onTimeRate = total == 0 ? 0 : Math.Round((double)delivered / total * 100, 1) })
            },
            new Report
            {
                ReportId = Guid.NewGuid(),
                ReportType = "Revenue",
                GeneratedAt = now,
                DataJson = JsonSerializer.Serialize(new { windowDays = 7, revenue })
            },
            new Report
            {
                ReportId = Guid.NewGuid(),
                ReportType = "HubPerformance",
                GeneratedAt = now,
                DataJson = JsonSerializer.Serialize(new { windowDays = 7, hubs = hubPerf })
            }
        };

        foreach (var r in reportsToCreate)
        {
            await _adminService.CreateReportAsync(r);
        }
    }

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