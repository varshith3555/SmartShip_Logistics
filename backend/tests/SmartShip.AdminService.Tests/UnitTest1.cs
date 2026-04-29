using Microsoft.Extensions.Logging;
using Moq;
using SmartShip.AdminService.DTOs;
using SmartShip.AdminService.Models;
using SmartShip.AdminService.Repositories;
using AdminServiceImpl = SmartShip.AdminService.Services.AdminService;

namespace SmartShip.AdminService.Tests;

public class AdminServiceTests
{
    [Test]
    public async Task ReportCustomerIssueAsync_WhenMessageEmpty_CreatesOpenCustomerIssueWithDefaultMessage()
    {
        var repo = new Mock<IAdminRepository>(MockBehavior.Strict);
        var logger = new Mock<ILogger<AdminServiceImpl>>();

        var shipmentId = Guid.NewGuid();

        repo.Setup(r => r.GetExceptionByShipmentIdAsync(shipmentId))
            .ReturnsAsync((ShipmentException?)null);

        ShipmentException? created = null;
        repo.Setup(r => r.AddExceptionAsync(It.IsAny<ShipmentException>()))
            .ReturnsAsync((ShipmentException ex) =>
            {
                created = ex;
                return ex;
            });

        var sut = new AdminServiceImpl(repo.Object, logger.Object);

        await sut.ReportCustomerIssueAsync(shipmentId, "   ");

        Assert.That(created, Is.Not.Null);
        Assert.That(created!.ShipmentId, Is.EqualTo(shipmentId));
        Assert.That(created.Type, Is.EqualTo("CustomerIssue"));
        Assert.That(created.Status, Is.EqualTo("OPEN"));
        Assert.That(created.Description, Does.Contain("Customer reported an issue."));

        repo.Verify(r => r.AddExceptionAsync(It.IsAny<ShipmentException>()), Times.Once);
        repo.Verify(r => r.UpdateExceptionAsync(It.IsAny<ShipmentException>()), Times.Never);
        repo.VerifyAll();
    }

    [Test]
    public async Task ReportCustomerIssueAsync_WhenExceptionExists_AppendsAndUpdates()
    {
        var repo = new Mock<IAdminRepository>(MockBehavior.Strict);
        var logger = new Mock<ILogger<AdminServiceImpl>>();

        var shipmentId = Guid.NewGuid();
        var existing = new ShipmentException
        {
            ExceptionId = Guid.NewGuid(),
            ShipmentId = shipmentId,
            Type = "CustomerIssue",
            Status = "OPEN",
            CreatedAt = DateTime.UtcNow,
            Description = "Previous"
        };

        repo.Setup(r => r.GetExceptionByShipmentIdAsync(shipmentId))
            .ReturnsAsync(existing);

        ShipmentException? updated = null;
        repo.Setup(r => r.UpdateExceptionAsync(It.IsAny<ShipmentException>()))
            .Callback<ShipmentException>(ex => updated = ex)
            .Returns(Task.CompletedTask);

        var sut = new AdminServiceImpl(repo.Object, logger.Object);

        await sut.ReportCustomerIssueAsync(shipmentId, "Package damaged");

        Assert.That(updated, Is.Not.Null);
        Assert.That(updated!.Description, Does.Contain("Previous"));
        Assert.That(updated.Description, Does.Contain("Package damaged"));

        repo.Verify(r => r.AddExceptionAsync(It.IsAny<ShipmentException>()), Times.Never);
        repo.Verify(r => r.UpdateExceptionAsync(It.IsAny<ShipmentException>()), Times.Once);
        repo.VerifyAll();
    }

    [Test]
    public async Task DelayExceptionAsync_WhenNoException_CreatesThenUpdatesWithDelayDetails()
    {
        var repo = new Mock<IAdminRepository>(MockBehavior.Strict);
        var logger = new Mock<ILogger<AdminServiceImpl>>();

        var shipmentId = Guid.NewGuid();

        repo.Setup(r => r.GetExceptionByShipmentIdAsync(shipmentId))
            .ReturnsAsync((ShipmentException?)null);

        repo.Setup(r => r.AddExceptionAsync(It.IsAny<ShipmentException>()))
            .ReturnsAsync((ShipmentException ex) => ex);

        ShipmentException? updated = null;
        repo.Setup(r => r.UpdateExceptionAsync(It.IsAny<ShipmentException>()))
            .Callback<ShipmentException>(ex => updated = ex)
            .Returns(Task.CompletedTask);

        var sut = new AdminServiceImpl(repo.Object, logger.Object);

        await sut.DelayExceptionAsync(shipmentId, new DelayShipmentRequest { DelayedByHours = 2, Reason = "Weather" });

        Assert.That(updated, Is.Not.Null);
        Assert.That(updated!.Type, Is.EqualTo("Delay"));
        Assert.That(updated.Status, Is.EqualTo("OPEN"));
        Assert.That(updated.Description, Does.Contain("Delayed by 2h"));
        Assert.That(updated.Description, Does.Contain("Weather"));

        repo.Verify(r => r.AddExceptionAsync(It.IsAny<ShipmentException>()), Times.Once);
        repo.Verify(r => r.UpdateExceptionAsync(It.IsAny<ShipmentException>()), Times.Once);
        repo.VerifyAll();
    }
}
