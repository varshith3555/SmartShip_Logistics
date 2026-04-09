using SmartShip.Contracts.Events;

namespace SmartShip.Core.Messaging;

public interface IEventBus
{
    void Publish(IntegrationEvent @event);
}
