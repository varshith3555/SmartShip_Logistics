using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using RabbitMQ.Client;
using SmartShip.Contracts.Events;

namespace SmartShip.Core.Messaging;

/// <summary>
/// RabbitMQ-based implementation of <see cref="IEventBus"/>.
/// </summary>
public class RabbitMQService : IEventBus, IDisposable
{
    private readonly IConnection _connection;
    private readonly IModel _channel;

    public RabbitMQService(IConfiguration configuration)
    {
        var factory = new ConnectionFactory
        {
            HostName = configuration["RabbitMQ:Host"] ?? "localhost",
            UserName = configuration["RabbitMQ:Username"] ?? "guest",
            Password = configuration["RabbitMQ:Password"] ?? "guest"
        };
        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();
    }

    /// <summary>
    /// Publishes an event to the <c>smartship_events</c> direct exchange using the event type name as routing key.
    /// </summary>
    public void Publish(IntegrationEvent @event)
    {
        var eventName = @event.GetType().Name;
        _channel.ExchangeDeclare(exchange: "smartship_events", type: ExchangeType.Direct);

        var message = JsonSerializer.Serialize((object)@event);
        var body = Encoding.UTF8.GetBytes(message);

        _channel.BasicPublish(exchange: "smartship_events",
            routingKey: eventName,
            basicProperties: null,
            body: body);
    }

    /// <summary>
    /// Creates a new RabbitMQ channel from the underlying connection.
    /// </summary>
    public IModel CreateChannel()
    {
        return _connection.CreateModel();
    }

    public void Dispose()
    {
        _channel?.Dispose();
        _connection?.Dispose();
    }
}
