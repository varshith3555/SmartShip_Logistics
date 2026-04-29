namespace SmartShip.Contracts.Events;

/// <summary>
/// Event published when a shipment is created.
/// </summary>
public class ShipmentCreatedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public decimal Weight { get; set; }
}

/// <summary>
/// Event published when a shipment is booked/assigned to a hub.
/// </summary>
public class ShipmentBookedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string HubId { get; set; } = string.Empty;
}

/// <summary>
/// Event published when a shipment is delivered.
/// </summary>
public class ShipmentDeliveredEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
}

/// <summary>
/// Event published when tracking status/location is updated.
/// </summary>
public class TrackingUpdatedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
}

// Choreography-based saga events (booking -> label generation -> exception on failure)
public class ShipmentBookingInitiatedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string HubId { get; set; } = string.Empty;
}

public class ShipmentLabelCreatedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public Guid DocumentId { get; set; }
    public string FileUrl { get; set; } = string.Empty;
}

public class ShipmentLabelCreationFailedEvent : IntegrationEvent
{
    public Guid ShipmentId { get; set; }
    public string TrackingNumber { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
