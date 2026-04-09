using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.IdentityService.DTOs;
using SmartShip.IdentityService.Services;

namespace SmartShip.IdentityService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "ADMIN")]
public class RolesController : ControllerBase
{
    private readonly IUserService _userService;

    public RolesController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRoles()
    {
        var roles = await _userService.GetRolesAsync();
        return Ok(roles);
    }

    [HttpPost]
    public IActionResult CreateRole()
    {
        return BadRequest("Static roles ADMIN and CUSTOMER are hardcoded. New roles cannot be created in this mock.");
    }

    [HttpPut("~/api/Users/{id}/role")]
    public async Task<IActionResult> AssignRoleToUser(Guid id, [FromBody] AssignRoleRequest request)
    {
        await _userService.AssignRoleAsync(id, request);
        return NoContent();
    }
}
