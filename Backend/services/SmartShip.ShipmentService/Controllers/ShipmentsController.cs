using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.ShipmentService.DTOs;
using SmartShip.ShipmentService.Services;

namespace SmartShip.ShipmentService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
/// <summary>
/// Shipments API for customers/admins to create, book, and manage shipments.
/// </summary>
public class ShipmentsController : ControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentsController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    /// <summary>
    /// Creates a new shipment for the authenticated user.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> Create([FromBody] CreateShipmentRequest request)
    {
        var shipment = await _shipmentService.CreateShipmentAsync(GetUserId(), request);
        return CreatedAtAction(nameof(GetById), new { id = shipment.ShipmentId }, shipment);
    }

    /// <summary>
    /// Books an existing shipment (customer only).
    /// </summary>
    [HttpPost("{id}/book")]
    [Authorize(Roles = "CUSTOMER")]
    public async Task<IActionResult> Book(Guid id)
    {
        await _shipmentService.BookShipmentAsync(GetUserId(), id);
        return NoContent();
    }

    /// <summary>
    /// Gets a shipment by its id.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var shipment = await _shipmentService.GetShipmentAsync(id);
        if (shipment == null) return NotFound();
        return Ok(shipment);
    }

    /// <summary>
    /// Gets shipments belonging to the authenticated customer.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "CUSTOMER")]
    public async Task<IActionResult> GetMyShipments()
    {
        var shipments = await _shipmentService.GetCustomerShipmentsAsync(GetUserId());
        return Ok(shipments);
    }

    [HttpGet]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAll([FromQuery] Guid? customerId = null)
    {
        var shipments = customerId.HasValue
            ? await _shipmentService.GetCustomerShipmentsAsync(customerId.Value)
            : await _shipmentService.GetAllShipmentsAsync();
        return Ok(shipments);
    }

    [HttpPut("{id}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateShipmentStatusRequest request)
    {
        await _shipmentService.UpdateShipmentStatusAsync(id, request);
        return NoContent();
    }

    [HttpPost("{id}/pickup")]
    [Authorize(Roles = "CUSTOMER")]
    public async Task<IActionResult> SchedulePickup(Guid id, [FromBody] SchedulePickupRequest request)
    {
        await _shipmentService.SchedulePickupAsync(id, request);
        return NoContent();
    }

    [HttpPut("{id}/pickup")]
    [Authorize(Roles = "CUSTOMER")]
    public async Task<IActionResult> UpdatePickup(Guid id, [FromBody] SchedulePickupRequest request)
    {
        await _shipmentService.UpdatePickupAsync(id, request);
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _shipmentService.DeleteShipmentAsync(id);
        return NoContent();
    }
    [HttpPut("{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateShipment(Guid id, [FromBody] UpdateShipmentRequest request)
    {
        await _shipmentService.UpdateShipmentAsync(id, request);
        return NoContent();
    }

    [HttpGet("{id}/pickup-details")]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> GetPickupDetails(Guid id)
    {
        var shipment = await _shipmentService.GetShipmentAsync(id);
        if (shipment == null || shipment.PickupDetails == null) return NotFound("Pickup details not found");
        return Ok(shipment.PickupDetails);
    }

    [HttpPost("{id}/packages")]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> AddPackage(Guid id, [FromBody] AddPackageRequest request)
    {
        var package = await _shipmentService.AddPackageAsync(id, request);
        return CreatedAtAction(nameof(GetPackages), new { id = id }, package);
    }

    [HttpGet("{id}/packages")]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> GetPackages(Guid id)
    {
        var shipment = await _shipmentService.GetShipmentAsync(id);
        if (shipment == null) return NotFound();
        return Ok(shipment.Items);
    }

    [HttpPut("{id}/packages/{packageId}")]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> UpdatePackage(Guid id, Guid packageId, [FromBody] UpdatePackageRequest request)
    {
        await _shipmentService.UpdatePackageAsync(packageId, request);
        return NoContent();
    }

    [HttpDelete("{id}/packages/{packageId}")]
    [Authorize(Roles = "CUSTOMER,ADMIN")]
    public async Task<IActionResult> DeletePackage(Guid id, Guid packageId)
    {
        await _shipmentService.DeletePackageAsync(packageId);
        return NoContent();
    }

    [HttpPost("calculate-rate")]
    [AllowAnonymous]
    public IActionResult CalculateRate([FromBody] CalculateRateRequest request)
    {
        var result = _shipmentService.CalculateRate(request);
        return Ok(result);
    }

    [HttpGet("services")]
    [AllowAnonymous]
    public IActionResult GetServices()
    {
        var services = _shipmentService.GetAvailableServices();
        return Ok(services);
    }
}
