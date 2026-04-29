namespace SmartShip.Contracts.Events;

/// <summary>
/// Base type for cross-service events published on the integration event bus.
/// </summary>
public abstract class IntegrationEvent
{
    public Guid Id { get; }
    public DateTime CreationDate { get; }

    protected IntegrationEvent()
    {
        Id = Guid.NewGuid();
        CreationDate = DateTime.UtcNow;
    }
}
