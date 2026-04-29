using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.TrackingService.DTOs;
using SmartShip.TrackingService.Services;

namespace SmartShip.TrackingService.Controllers;

[ApiController]
[Route("api")]
/// <summary>
/// Tracking API for querying shipment tracking details and managing tracking events.
/// </summary>
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _trackingService;

    public TrackingController(ITrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    /// <summary>
    /// Gets the tracking timeline (including history) for a tracking number.
    /// </summary>
    [HttpGet("{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTracking(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response);
    }

    /// <summary>
    /// Gets only the tracking history entries for a tracking number.
    /// </summary>
    [HttpGet("{trackingNumber}/timeline")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTimeline(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response.History);
    }

    /// <summary>
    /// Gets tracking events for a tracking number.
    /// </summary>
    [HttpGet("{trackingNumber}/events")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response.History);
    }

    /// <summary>
    /// Creates a tracking event (admin only).
    /// </summary>
    [HttpPost("events")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateTrackingEventRequest request)
    {
        var result = await _trackingService.CreateEventAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Updates an existing tracking event (admin only).
    /// </summary>
    [HttpPut("events/{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateTrackingEventRequest request)
    {
        await _trackingService.UpdateEventAsync(id, request);
        return NoContent();
    }

    /// <summary>
    /// Deletes a tracking event by id (admin only).
    /// </summary>
    [HttpDelete("events/{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        await _trackingService.DeleteEventAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Updates the current location for a tracking number.
    /// </summary>
    [HttpPost("location")]
    [Authorize(Roles = "ADMIN,CUSTOMER")]
    public async Task<IActionResult> UpdateLocation([FromBody] PostLocationRequest request)
    {
        await _trackingService.UpdateLocationAsync(request);
        return NoContent();
    }

    /// <summary>
    /// Gets the most recent known location for a tracking number.
    /// </summary>
    [HttpGet("location/{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLocation(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound();
        var latestEvent = response.History.OrderByDescending(h => h.Timestamp).FirstOrDefault();
        return Ok(new { CurrentLocation = latestEvent?.Location ?? "Unknown" });
    }

    /// <summary>
    /// Gets the current status for a tracking number.
    /// </summary>
    [HttpGet("{trackingNumber}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStatus(string trackingNumber)
    {
        var status = await _trackingService.GetCurrentStatusAsync(trackingNumber);
        return Ok(new { Status = status });
    }

    /// <summary>
    /// Updates the current status for a tracking number (admin only).
    /// </summary>
    [HttpPut("{trackingNumber}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateStatus(string trackingNumber, [FromBody] UpdateStatusRequest request)
    {
        await _trackingService.UpdateStatusAsync(trackingNumber, request);
        return NoContent();
    }
}
