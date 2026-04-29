using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Services;

namespace SmartShip.AdminService.Controllers;

[ApiController]
[Route("api/support")]
[Authorize(Roles = "CUSTOMER,ADMIN")]
public class SupportController : ControllerBase
{
    private readonly IAdminService _adminService;

    public SupportController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    [HttpPost("issues")]
    public async Task<IActionResult> ReportIssue([FromBody] ReportIssueRequest request)
    {
        await _adminService.ReportCustomerIssueAsync(request.ShipmentId, request.Message);
        return NoContent();
    }
}
