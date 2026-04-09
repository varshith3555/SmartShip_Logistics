using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.TrackingService.DTOs;
using SmartShip.TrackingService.Services;

namespace SmartShip.TrackingService.Controllers;

[ApiController]
[Route("api")]
public class TrackingController : ControllerBase
{
    private readonly ITrackingService _trackingService;

    public TrackingController(ITrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    [HttpGet("{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTracking(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response);
    }

    [HttpGet("{trackingNumber}/timeline")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTimeline(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response.History);
    }

    [HttpGet("{trackingNumber}/events")]
    [AllowAnonymous]
    public async Task<IActionResult> GetEvents(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound("Tracking number not found");
        return Ok(response.History);
    }

    [HttpPost("events")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> CreateEvent([FromBody] CreateTrackingEventRequest request)
    {
        var result = await _trackingService.CreateEventAsync(request);
        return Ok(result);
    }

    [HttpPut("events/{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateEvent(Guid id, [FromBody] UpdateTrackingEventRequest request)
    {
        await _trackingService.UpdateEventAsync(id, request);
        return NoContent();
    }

    [HttpDelete("events/{id}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> DeleteEvent(Guid id)
    {
        await _trackingService.DeleteEventAsync(id);
        return NoContent();
    }

    [HttpPost("location")]
    [Authorize(Roles = "ADMIN,CUSTOMER")]
    public async Task<IActionResult> UpdateLocation([FromBody] PostLocationRequest request)
    {
        await _trackingService.UpdateLocationAsync(request);
        return NoContent();
    }

    [HttpGet("location/{trackingNumber}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetLocation(string trackingNumber)
    {
        var response = await _trackingService.GetTrackingTimelineAsync(trackingNumber);
        if (response == null) return NotFound();
        var latestEvent = response.History.OrderByDescending(h => h.Timestamp).FirstOrDefault();
        return Ok(new { CurrentLocation = latestEvent?.Location ?? "Unknown" });
    }

    [HttpGet("{trackingNumber}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStatus(string trackingNumber)
    {
        var status = await _trackingService.GetCurrentStatusAsync(trackingNumber);
        return Ok(new { Status = status });
    }

    [HttpPut("{trackingNumber}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateStatus(string trackingNumber, [FromBody] UpdateStatusRequest request)
    {
        await _trackingService.UpdateStatusAsync(trackingNumber, request);
        return NoContent();
    }
}
