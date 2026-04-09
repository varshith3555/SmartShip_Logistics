using SmartShip.Contracts.Events;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Messaging;
using SmartShip.ShipmentService.DTOs;
using SmartShip.ShipmentService.Models;
using SmartShip.ShipmentService.Repositories;
using Microsoft.Extensions.Logging;

namespace SmartShip.ShipmentService.Services;

public class ShipmentService : IShipmentService
{
    private readonly IShipmentRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<ShipmentService> _logger;

    public ShipmentService(IShipmentRepository repository, IEventBus eventBus, ILogger<ShipmentService> logger)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
    }

    public async Task<Shipment> CreateShipmentAsync(Guid userId, CreateShipmentRequest request)
    {
        var totalWeight = request.Items.Sum(i => i.Weight * i.Quantity);
        var price = CalculatePrice(totalWeight);
        var trackingNumber = "TRK" + DateTime.UtcNow.Ticks.ToString().Substring(8);

        // Sender Address
        var sender = new Address
        {
            AddressId = Guid.NewGuid(),
            Name = request.SenderAddress.Name,
            Phone = request.SenderAddress.Phone,
            Street = request.SenderAddress.Street,
            City = request.SenderAddress.City,
            State = request.SenderAddress.State,
            Country = request.SenderAddress.Country,
            Pincode = request.SenderAddress.Pincode
        };

        // Receiver Address
        var receiver = new Address
        {
            AddressId = Guid.NewGuid(),
            Name = request.ReceiverAddress.Name,
            Phone = request.ReceiverAddress.Phone,
            Street = request.ReceiverAddress.Street,
            City = request.ReceiverAddress.City,
            State = request.ReceiverAddress.State,
            Country = request.ReceiverAddress.Country,
            Pincode = request.ReceiverAddress.Pincode
        };

        // Shipment
        var shipment = new Shipment
        {
            ShipmentId = Guid.NewGuid(),
            UserId = userId,
            TrackingNumber = trackingNumber,
            Status = "CREATED", // FIXED
            TotalWeight = totalWeight,
            Price = price,
            CreatedAt = DateTime.UtcNow,
            SenderAddressId = sender.AddressId,
            ReceiverAddressId = receiver.AddressId,
            SenderAddress = sender,
            ReceiverAddress = receiver,
            Items = request.Items.Select(i => new ShipmentItem
            {
                ItemId = Guid.NewGuid(),
                ItemName = i.ItemName,
                Quantity = i.Quantity,
                Weight = i.Weight
            }).ToList()
        };

        var created = await _repository.CreateAsync(shipment);

        _logger.LogInformation("Shipment created with ID {ShipmentId}", created.ShipmentId);

        // EVENT 1: Shipment Created
        _eventBus.Publish(new ShipmentCreatedEvent
        {
            ShipmentId = created.ShipmentId,
            TrackingNumber = created.TrackingNumber,
            CustomerId = created.UserId,
            Weight = created.TotalWeight
        });

        // EVENT 2: Tracking Update (IMPORTANT)
        _eventBus.Publish(new TrackingUpdatedEvent
        {
            ShipmentId = created.ShipmentId,
            TrackingNumber = created.TrackingNumber,
            Status = "CREATED",
            Location = "System",
            Remarks = "Shipment Created"
        });

        return created;
    }

    public async Task<Shipment?> GetShipmentAsync(Guid id) => await _repository.GetByIdAsync(id);

    public async Task<IEnumerable<Shipment>> GetCustomerShipmentsAsync(Guid userId) => await _repository.GetByUserIdAsync(userId);

    public async Task<IEnumerable<Shipment>> GetAllShipmentsAsync() => await _repository.GetAllAsync();

    public async Task UpdateShipmentStatusAsync(Guid id, UpdateShipmentStatusRequest request)
    {
        var shipment = await _repository.GetByIdAsync(id) ?? throw new SmartShipNotFoundException("Shipment not found");

        ShipmentStatus newStatus;
        try
        {
            newStatus = ParseStatus(request.Status);
            ValidateStatusTransition(shipment.Status, newStatus);
        }
        catch (SmartShipBadRequestException ex)
        {
            _logger.LogWarning(ex, "Invalid shipment status update for {ShipmentId}. Requested={RequestedStatus} Current={CurrentStatus}", id, request.Status, shipment.Status);
            throw;
        }

        shipment.Status = newStatus.ToString();
        await _repository.UpdateAsync(shipment);

        _logger.LogInformation("Shipment {ShipmentId} status updated to {Status}", shipment.ShipmentId, shipment.Status);

        if (newStatus == ShipmentStatus.BOOKED)
        {
            _eventBus.Publish(new ShipmentBookedEvent
            {
                ShipmentId = shipment.ShipmentId,
                TrackingNumber = shipment.TrackingNumber,
                HubId = "HUB-MAIN"
            });
        }
        else if (newStatus == ShipmentStatus.DELIVERED)
        {
            _eventBus.Publish(new ShipmentDeliveredEvent
            {
                ShipmentId = shipment.ShipmentId,
                TrackingNumber = shipment.TrackingNumber
            });
        }

        // Always update tracking
        _eventBus.Publish(new TrackingUpdatedEvent
        {
            ShipmentId = shipment.ShipmentId,
            TrackingNumber = shipment.TrackingNumber,
            Status = shipment.Status,
            Location = "System",
            Remarks = "Status Updated"
        });
    }

    public async Task SchedulePickupAsync(Guid id, SchedulePickupRequest request)
    {
        var shipment = await _repository.GetByIdAsync(id) ?? throw new SmartShipNotFoundException("Shipment not found");

        shipment.PickupDetails = new PickupDetails
        {
            PickupId = Guid.NewGuid(),
            ShipmentId = shipment.ShipmentId,
            ScheduledDate = request.ScheduledDate,
            PickupStatus = "Scheduled"
        };

        await _repository.UpdateAsync(shipment);

        _logger.LogInformation("Pickup scheduled for shipment {ShipmentId}", shipment.ShipmentId);
    }

    public async Task UpdatePickupAsync(Guid id, SchedulePickupRequest request)
    {
        var shipment = await _repository.GetByIdAsync(id) ?? throw new SmartShipNotFoundException("Shipment not found");

        if (shipment.PickupDetails == null)
        {
            throw new SmartShipNotFoundException("Pickup details not found");
        }

        shipment.PickupDetails.ScheduledDate = request.ScheduledDate;
        shipment.PickupDetails.PickupStatus = "Rescheduled";

        await _repository.UpdateAsync(shipment);

        _logger.LogInformation("Pickup updated for shipment {ShipmentId}", shipment.ShipmentId);
    }

    private static ShipmentStatus ParseStatus(string status)
    {
        var normalized = (status ?? string.Empty).Trim().ToUpperInvariant();
        normalized = normalized.Replace('-', '_').Replace(' ', '_');

        if (Enum.TryParse<ShipmentStatus>(normalized, ignoreCase: true, out var parsed))
        {
            if (parsed == ShipmentStatus.CREATED)
            {
                throw new SmartShipBadRequestException("Status cannot be set to CREATED");
            }

            return parsed;
        }

        throw new SmartShipBadRequestException("Invalid status. Allowed: BOOKED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELAYED, CANCELLED");
    }

    private static void ValidateStatusTransition(string currentStatusRaw, ShipmentStatus next)
    {
        var currentNormalized = (currentStatusRaw ?? string.Empty).Trim().ToUpperInvariant();

        // Keep it simple: allow if current is empty/unknown (legacy), otherwise enforce linear transitions
        if (!Enum.TryParse<ShipmentStatus>(currentNormalized, ignoreCase: true, out var current))
        {
            return;
        }

        // Terminal states
        if (current == ShipmentStatus.CANCELLED)
        {
            throw new SmartShipBadRequestException($"Invalid status transition from {current} to {next}");
        }

        // Allow DELAYED/CANCELLED as exceptional states from most non-terminal states
        if (next == ShipmentStatus.DELAYED)
        {
            if (current == ShipmentStatus.DELIVERED)
                throw new SmartShipBadRequestException($"Invalid status transition from {current} to {next}");
            return;
        }

        if (next == ShipmentStatus.CANCELLED)
        {
            if (current == ShipmentStatus.DELIVERED)
                throw new SmartShipBadRequestException($"Invalid status transition from {current} to {next}");
            return;
        }

        var order = new Dictionary<ShipmentStatus, int>
        {
            { ShipmentStatus.CREATED, 0 },
            { ShipmentStatus.BOOKED, 1 },
            { ShipmentStatus.IN_TRANSIT, 2 },
            { ShipmentStatus.OUT_FOR_DELIVERY, 3 },
            { ShipmentStatus.DELIVERED, 4 }
        };

        // If a shipment is currently DELAYED, allow resuming normal flow based on its previous stage.
        if (current == ShipmentStatus.DELAYED)
        {
            return;
        }

        if (order[next] < order[current])
        {
            throw new SmartShipBadRequestException($"Invalid status transition from {current} to {next}");
        }
    }

    public async Task DeleteShipmentAsync(Guid id)
    {
        var shipment = await _repository.GetByIdAsync(id) ?? throw new SmartShipNotFoundException("Shipment not found");
        await _repository.DeleteAsync(shipment);
    }

    private decimal CalculatePrice(decimal weight)
    {
        return 10.0m + (weight * 2.5m);
    }

    public async Task UpdateShipmentAsync(Guid id, UpdateShipmentRequest request)
    {
        var shipment = await _repository.GetByIdAsync(id) ?? throw new SmartShipNotFoundException("Shipment not found");

        shipment.TotalWeight = request.TotalWeight;
        shipment.Price = CalculatePrice(shipment.TotalWeight);

        await _repository.UpdateAsync(shipment);
    }

    public async Task<ShipmentItem> AddPackageAsync(Guid shipmentId, AddPackageRequest request)
    {
        var shipment = await _repository.GetByIdAsync(shipmentId) ?? throw new SmartShipNotFoundException("Shipment not found");

        var package = new ShipmentItem
        {
            ItemId = Guid.NewGuid(),
            ShipmentId = shipmentId,
            ItemName = request.ItemName,
            Quantity = request.Quantity,
            Weight = request.Weight
        };

        shipment.Items.Add(package);

        shipment.TotalWeight = shipment.Items.Sum(i => i.Weight * i.Quantity);
        shipment.Price = CalculatePrice(shipment.TotalWeight);

        await _repository.UpdateAsync(shipment);
        return package;
    }

    public async Task UpdatePackageAsync(Guid packageId, UpdatePackageRequest request)
    {
        var item = await _repository.GetItemByIdAsync(packageId) ?? throw new SmartShipNotFoundException("Package not found");

        item.ItemName = request.ItemName;
        item.Quantity = request.Quantity;
        item.Weight = request.Weight;

        var shipment = await _repository.GetByIdAsync(item.ShipmentId);
        if (shipment != null)
        {
            shipment.TotalWeight = shipment.Items.Sum(i => i.Weight * i.Quantity);
            shipment.Price = CalculatePrice(shipment.TotalWeight);
            await _repository.UpdateAsync(shipment);
        }
    }

    public async Task DeletePackageAsync(Guid packageId)
    {
        var item = await _repository.GetItemByIdAsync(packageId) ?? throw new SmartShipNotFoundException("Package not found");

        await _repository.DeleteItemAsync(item);

        var shipment = await _repository.GetByIdAsync(item.ShipmentId);
        if (shipment != null)
        {
            shipment.TotalWeight = shipment.Items.Sum(i => i.Weight * i.Quantity);
            shipment.Price = CalculatePrice(shipment.TotalWeight);
            await _repository.UpdateAsync(shipment);
        }
    }

    public CalculateRateResponse CalculateRate(CalculateRateRequest request)
    {
        return new CalculateRateResponse
        {
            EstimatedPrice = CalculatePrice(request.TotalWeight) + 5.00m
        };
    }

    public IEnumerable<ServiceTypeDto> GetAvailableServices()
    {
        return new List<ServiceTypeDto>
        {
            new ServiceTypeDto { ServiceName = "Standard", Description = "5-7 business days", BasePrice = 10.0m },
            new ServiceTypeDto { ServiceName = "Express", Description = "2-3 business days", BasePrice = 25.0m },
            new ServiceTypeDto { ServiceName = "Overnight", Description = "Next business day", BasePrice = 50.0m }
        };
    }
}