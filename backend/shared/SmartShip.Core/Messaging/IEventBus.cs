using SmartShip.Contracts.Events;

namespace SmartShip.Core.Messaging;

/// <summary>
/// Abstraction for publishing integration events.
/// </summary>
public interface IEventBus
{
    /// <summary>
    /// Publishes an integration event to the configured message broker.
    /// </summary>
    void Publish(IntegrationEvent @event);
}
