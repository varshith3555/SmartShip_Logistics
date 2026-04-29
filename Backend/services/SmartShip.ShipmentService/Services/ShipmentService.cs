using SmartShip.Contracts.Events;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Messaging;
using SmartShip.ShipmentService.DTOs;
using SmartShip.ShipmentService.Models;
using SmartShip.ShipmentService.Repositories;
using Microsoft.Extensions.Logging;
using System.Net;
using System.Net.Http.Json;

namespace SmartShip.ShipmentService.Services;

public class ShipmentService : IShipmentService
{
    private readonly IShipmentRepository _repository;
    private readonly IEventBus _eventBus;
    private readonly ILogger<ShipmentService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    private const decimal BaseShipmentPrice = 30.0m;
    private const decimal PricePerKg = 10.0m;
    private const decimal RateQuoteSurcharge = 15.00m;

    private static readonly HashSet<ShipmentStatus> HubRequiredStatuses = new()
    {
        ShipmentStatus.PICKED_UP,
        ShipmentStatus.IN_TRANSIT,
        ShipmentStatus.OUT_FOR_DELIVERY,
        ShipmentStatus.DELAYED,
        ShipmentStatus.DELIVERED,
    };

    public ShipmentService(IShipmentRepository repository, IEventBus eventBus, ILogger<ShipmentService> logger, IHttpClientFactory httpClientFactory)
    {
        _repository = repository;
        _eventBus = eventBus;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
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
            Status = ShipmentStatus.DRAFT.ToString(),
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
            Status = created.Status,
            Location = "System",
            Remarks = "Shipment Draft Created"
        });

        return created;
    }

    public async Task BookShipmentAsync(Guid userId, Guid shipmentId)
    {
        var shipment = await _repository.GetByIdAsync(shipmentId) ?? throw new SmartShipNotFoundException("Shipment not found");

        if (shipment.UserId != userId)
        {
            throw new SmartShipForbiddenException("You do not have access to this shipment");
        }

        var current = NormalizeLegacyStatus(shipment.Status);
        if (current != ShipmentStatus.DRAFT)
        {
            throw new SmartShipBadRequestException($"Shipment cannot be booked from status {shipment.Status}");
        }

        shipment.Status = ShipmentStatus.BOOKED.ToString();
        await _repository.UpdateAsync(shipment);

        _logger.LogInformation("Shipment {ShipmentId} booked by customer {UserId}", shipment.ShipmentId, userId);

        _eventBus.Publish(new ShipmentBookedEvent
        {
            ShipmentId = shipment.ShipmentId,
            TrackingNumber = shipment.TrackingNumber,
            HubId = "HUB-MAIN"
        });

        // Choreography saga step: ask DocumentService to generate shipment label
        _eventBus.Publish(new ShipmentBookingInitiatedEvent
        {
            ShipmentId = shipment.ShipmentId,
            TrackingNumber = shipment.TrackingNumber,
            CustomerId = shipment.UserId,
            HubId = "HUB-MAIN"
        });

        _eventBus.Publish(new TrackingUpdatedEvent
        {
            ShipmentId = shipment.ShipmentId,
            TrackingNumber = shipment.TrackingNumber,
            Status = shipment.Status,
            Location = "System",
            Remarks = "Shipment Booked"
        });
    }

    public async Task<Shipment?> GetShipmentAsync(Guid id)
    {
        var shipment = await _repository.GetByIdAsync(id);
        if (shipment != null)
        {
            shipment.Price = CalculatePrice(shipment.TotalWeight);
        }

        return shipment;
    }

    public async Task<IEnumerable<Shipment>> GetCustomerShipmentsAsync(Guid userId)
    {
        var shipments = (await _repository.GetByUserIdAsync(userId)).ToList();
        foreach (var shipment in shipments)
        {
            shipment.Price = CalculatePrice(shipment.TotalWeight);
        }

        return shipments;
    }

    public async Task<IEnumerable<Shipment>> GetAllShipmentsAsync()
    {
        var shipments = (await _repository.GetAllAsync()).ToList();
        foreach (var shipment in shipments)
        {
            shipment.Price = CalculatePrice(shipment.TotalWeight);
        }

        return shipments;
    }

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

        string location = "System";
        string remarks = "Status Updated";

        if (HubRequiredStatuses.Contains(newStatus))
        {
            if (!request.HubId.HasValue)
            {
                throw new SmartShipBadRequestException($"HubId is required for status {newStatus}");
            }

            var hub = await GetHubSnapshotAsync(request.HubId.Value);
            location = FormatHubLocation(hub);
            remarks = newStatus == ShipmentStatus.DELIVERED
                ? "Delivered"
                : newStatus == ShipmentStatus.DELAYED
                    ? "Delayed"
                    : "Arrived at hub";
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

            // Choreography saga step: ask DocumentService to generate shipment label
            _eventBus.Publish(new ShipmentBookingInitiatedEvent
            {
                ShipmentId = shipment.ShipmentId,
                TrackingNumber = shipment.TrackingNumber,
                CustomerId = shipment.UserId,
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
            Location = location,
            Remarks = remarks
        });
    }

    private sealed class AdminHubSnapshot
    {
        public Guid HubId { get; set; }
        public string HubName { get; set; } = string.Empty;
        public AdminLocationSnapshot? Location { get; set; }
    }

    private sealed class AdminLocationSnapshot
    {
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
        public string Pincode { get; set; } = string.Empty;
    }

    private async Task<AdminHubSnapshot> GetHubSnapshotAsync(Guid hubId)
    {
        var client = _httpClientFactory.CreateClient("AdminService");
        using var resp = await client.GetAsync($"api/hubs/{hubId}");

        if (resp.StatusCode == HttpStatusCode.NotFound)
        {
            throw new SmartShipBadRequestException("Invalid hubId");
        }

        if (!resp.IsSuccessStatusCode)
        {
            _logger.LogWarning("Hub lookup failed. Status={StatusCode}", (int)resp.StatusCode);
            throw new SmartShipBadRequestException("Unable to validate hub at this time");
        }

        var hub = await resp.Content.ReadFromJsonAsync<AdminHubSnapshot>();
        if (hub is null)
        {
            throw new SmartShipBadRequestException("Invalid hub response");
        }

        if (hub.Location is null)
        {
            throw new SmartShipBadRequestException("Hub location not found");
        }

        return hub;
    }

    private static string FormatHubLocation(AdminHubSnapshot hub)
    {
        var loc = hub.Location;
        var city = (loc?.City ?? string.Empty).Trim();
        var state = (loc?.State ?? string.Empty).Trim();
        var country = (loc?.Country ?? string.Empty).Trim();
        var pincode = (loc?.Pincode ?? string.Empty).Trim();

        var place = string.Join(", ", new[] { city, state }.Where(s => !string.IsNullOrWhiteSpace(s)));
        var pin = string.IsNullOrWhiteSpace(pincode) ? "" : $" ({pincode})";
        var countrySuffix = string.IsNullOrWhiteSpace(country) ? "" : $", {country}";

        return $"{hub.HubName} — {place}{pin}{countrySuffix}".Trim();
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

        // Backward-compat: legacy CREATED == new DRAFT
        if (normalized == "CREATED") return ShipmentStatus.DRAFT;

        if (Enum.TryParse<ShipmentStatus>(normalized, ignoreCase: true, out var parsed))
        {
            if (parsed == ShipmentStatus.DRAFT)
                throw new SmartShipBadRequestException("Status cannot be set to DRAFT");

            return parsed;
        }

        throw new SmartShipBadRequestException("Invalid status. Allowed: BOOKED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, DELAYED, FAILED, RETURNED, CANCELLED");
    }

    private static ShipmentStatus NormalizeLegacyStatus(string currentStatusRaw)
    {
        var normalized = (currentStatusRaw ?? string.Empty).Trim().ToUpperInvariant();
        normalized = normalized.Replace('-', '_').Replace(' ', '_');

        if (normalized == "CREATED") return ShipmentStatus.DRAFT;
        if (normalized == "DRAFT") return ShipmentStatus.DRAFT;

        if (Enum.TryParse<ShipmentStatus>(normalized, ignoreCase: true, out var current))
        {
            return current;
        }

        // Unknown legacy value: treat as BOOKED so admin can progress it.
        return ShipmentStatus.BOOKED;
    }

    private static void ValidateStatusTransition(string currentStatusRaw, ShipmentStatus next)
    {
        var current = NormalizeLegacyStatus(currentStatusRaw);

        // Terminal states
        if (current is ShipmentStatus.CANCELLED or ShipmentStatus.DELIVERED or ShipmentStatus.FAILED or ShipmentStatus.RETURNED)
        {
            throw new SmartShipBadRequestException($"Invalid status transition from {current} to {next}");
        }

        // Allow DELAYED/CANCELLED/FAILED/RETURNED as exceptional states from most non-terminal states
        if (next is ShipmentStatus.DELAYED or ShipmentStatus.CANCELLED or ShipmentStatus.FAILED or ShipmentStatus.RETURNED)
        {
            return;
        }

        var order = new Dictionary<ShipmentStatus, int>
        {
            { ShipmentStatus.DRAFT, 0 },
            { ShipmentStatus.BOOKED, 1 },
            { ShipmentStatus.PICKED_UP, 2 },
            { ShipmentStatus.IN_TRANSIT, 3 },
            { ShipmentStatus.OUT_FOR_DELIVERY, 4 },
            { ShipmentStatus.DELIVERED, 5 }
        };

        // If a shipment is currently DELAYED, allow resuming normal flow.
        if (current == ShipmentStatus.DELAYED)
        {
            return;
        }

        if (!order.ContainsKey(current) || !order.ContainsKey(next))
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
        return BaseShipmentPrice + (weight * PricePerKg);
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
            EstimatedPrice = CalculatePrice(request.TotalWeight) + RateQuoteSurcharge
        };
    }

    public IEnumerable<ServiceTypeDto> GetAvailableServices()
    {
        return new List<ServiceTypeDto>
        {
            new ServiceTypeDto { ServiceName = "Standard", Description = "5-7 business days", BasePrice = 30.0m },
            new ServiceTypeDto { ServiceName = "Express", Description = "2-3 business days", BasePrice = 75.0m },
            new ServiceTypeDto { ServiceName = "Overnight", Description = "Next business day", BasePrice = 150.0m }
        };
    }
}