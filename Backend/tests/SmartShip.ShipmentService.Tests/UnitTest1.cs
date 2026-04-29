using Microsoft.Extensions.Logging;
using Moq;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Messaging;
using SmartShip.ShipmentService.DTOs;
using SmartShip.ShipmentService.Models;
using SmartShip.ShipmentService.Repositories;
using ShipmentServiceImpl = SmartShip.ShipmentService.Services.ShipmentService;

namespace SmartShip.ShipmentService.Tests;

public class ShipmentServiceTests
{
    [Test]
    public void CalculateRate_AddsSurcharge()
    {
        var repo = new Mock<IShipmentRepository>(MockBehavior.Strict);
        var bus = new Mock<IEventBus>(MockBehavior.Strict);
        var logger = new Mock<ILogger<ShipmentServiceImpl>>();
        var httpFactory = new Mock<IHttpClientFactory>(MockBehavior.Strict);

        var sut = new ShipmentServiceImpl(repo.Object, bus.Object, logger.Object, httpFactory.Object);

        var resp = sut.CalculateRate(new CalculateRateRequest { TotalWeight = 3.5m });

        // Base 30 + (3.5 * 10) + 15 surcharge = 80
        Assert.That(resp.EstimatedPrice, Is.EqualTo(80.0m));
    }

    [Test]
    public void GetAvailableServices_ReturnsThreeOptions()
    {
        var repo = new Mock<IShipmentRepository>(MockBehavior.Strict);
        var bus = new Mock<IEventBus>(MockBehavior.Strict);
        var logger = new Mock<ILogger<ShipmentServiceImpl>>();
        var httpFactory = new Mock<IHttpClientFactory>(MockBehavior.Strict);

        var sut = new ShipmentServiceImpl(repo.Object, bus.Object, logger.Object, httpFactory.Object);

        var services = sut.GetAvailableServices().ToList();

        Assert.That(services, Has.Count.EqualTo(3));
        Assert.That(services.Select(s => s.ServiceName), Is.EquivalentTo(new[] { "Standard", "Express", "Overnight" }));
    }

    [Test]
    public async Task UpdateShipmentStatusAsync_WhenRequestStatusIsDraft_ThrowsBadRequest()
    {
        var repo = new Mock<IShipmentRepository>(MockBehavior.Strict);
        var bus = new Mock<IEventBus>(MockBehavior.Strict);
        var logger = new Mock<ILogger<ShipmentServiceImpl>>();
        var httpFactory = new Mock<IHttpClientFactory>(MockBehavior.Strict);

        var shipmentId = Guid.NewGuid();
        repo.Setup(r => r.GetByIdAsync(shipmentId))
            .ReturnsAsync(new Shipment { ShipmentId = shipmentId, Status = ShipmentStatus.BOOKED.ToString(), TrackingNumber = "TRK123", UserId = Guid.NewGuid() });

        var sut = new ShipmentServiceImpl(repo.Object, bus.Object, logger.Object, httpFactory.Object);

        var ex = Assert.ThrowsAsync<SmartShipBadRequestException>(() =>
            sut.UpdateShipmentStatusAsync(shipmentId, new UpdateShipmentStatusRequest { Status = "DRAFT" }));

        Assert.That(ex!.Message, Does.Contain("Status cannot be set to DRAFT"));

        repo.VerifyAll();
    }
}
