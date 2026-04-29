using Moq;
using SmartShip.TrackingService.Models;
using SmartShip.TrackingService.Repositories;
using TrackingServiceImpl = SmartShip.TrackingService.Services.TrackingService;

namespace SmartShip.TrackingService.Tests;

public class TrackingServiceTests
{
    [Test]
    public async Task GetTrackingTimelineAsync_WhenStatusMissing_ReturnsNull()
    {
        var repo = new Mock<ITrackingRepository>(MockBehavior.Strict);
        repo.Setup(r => r.GetStatusAsync("TRK1")).ReturnsAsync((ShipmentStatus?)null);

        var sut = new TrackingServiceImpl(repo.Object);

        var timeline = await sut.GetTrackingTimelineAsync("TRK1");

        Assert.That(timeline, Is.Null);
        repo.VerifyAll();
    }

    [Test]
    public async Task GetTrackingTimelineAsync_MapsTimestampsAsUtc()
    {
        var repo = new Mock<ITrackingRepository>(MockBehavior.Strict);

        repo.Setup(r => r.GetStatusAsync("TRK2")).ReturnsAsync(new ShipmentStatus
        {
            TrackingNumber = "TRK2",
            CurrentStatus = "IN_TRANSIT",
            UpdatedAt = new DateTime(2025, 01, 01, 10, 0, 0, DateTimeKind.Unspecified)
        });

        repo.Setup(r => r.GetHistoryAsync("TRK2")).ReturnsAsync(new List<TrackingHistory>
        {
            new()
            {
                TrackingNumber = "TRK2",
                Status = "BOOKED",
                Location = "System",
                Timestamp = new DateTime(2025, 01, 01, 9, 0, 0, DateTimeKind.Unspecified),
                Remarks = "Booked"
            }
        });

        var sut = new TrackingServiceImpl(repo.Object);

        var timeline = await sut.GetTrackingTimelineAsync("TRK2");

        Assert.That(timeline, Is.Not.Null);
        Assert.That(timeline!.LastUpdatedAt.Kind, Is.EqualTo(DateTimeKind.Utc));
        Assert.That(timeline.History, Has.Count.EqualTo(1));
        Assert.That(timeline.History[0].Timestamp.Kind, Is.EqualTo(DateTimeKind.Utc));

        repo.VerifyAll();
    }
}
