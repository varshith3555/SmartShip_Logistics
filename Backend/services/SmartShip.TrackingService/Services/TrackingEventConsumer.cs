using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SmartShip.Contracts.Events;
using SmartShip.TrackingService.Models;
using SmartShip.TrackingService.Repositories;

namespace SmartShip.TrackingService.Services;

public class TrackingEventConsumer : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConnection _connection;
    private readonly IModel _channel;

    public TrackingEventConsumer(IServiceProvider serviceProvider, IConfiguration config)
    {
        _serviceProvider = serviceProvider;

        var factory = new ConnectionFactory
        {
            HostName = config["RabbitMQ:Host"] ?? "localhost",
            UserName = config["RabbitMQ:Username"] ?? "guest",
            Password = config["RabbitMQ:Password"] ?? "guest"
        };

        _connection = factory.CreateConnection();
        _channel = _connection.CreateModel();

        _channel.ExchangeDeclare("smartship_events", ExchangeType.Direct);

        _channel.QueueDeclare("tracking_queue", true, false, false);

        _channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentCreatedEvent));
        _channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentBookedEvent));
        _channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentDeliveredEvent));
        _channel.QueueBind("tracking_queue", "smartship_events", nameof(TrackingUpdatedEvent));
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var consumer = new EventingBasicConsumer(_channel);

        consumer.Received += async (model, ea) =>
        {
            var message = Encoding.UTF8.GetString(ea.Body.ToArray());
            var routingKey = ea.RoutingKey;

            using var scope = _serviceProvider.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<ITrackingRepository>();

            if (routingKey == nameof(ShipmentCreatedEvent))
            {
                var e = JsonSerializer.Deserialize<ShipmentCreatedEvent>(message);
                if (e != null)
                {
                    await repo.UpsertStatusAsync(new ShipmentStatus
                    {
                        TrackingNumber = e.TrackingNumber,
                        CurrentStatus = "CREATED",
                        UpdatedAt = DateTime.UtcNow
                    });

                    await repo.AddHistoryAsync(new TrackingHistory
                    {
                        TrackingId = Guid.NewGuid(),
                        TrackingNumber = e.TrackingNumber,
                        Status = "CREATED",
                        Location = "System",
                        Timestamp = DateTime.UtcNow,
                        Remarks = "Shipment Created"
                    });
                }
            }

            else if (routingKey == nameof(TrackingUpdatedEvent))
            {
                var e = JsonSerializer.Deserialize<TrackingUpdatedEvent>(message);
                if (e != null)
                {
                    await repo.UpsertStatusAsync(new ShipmentStatus
                    {
                        TrackingNumber = e.TrackingNumber,
                        CurrentStatus = e.Status,
                        UpdatedAt = DateTime.UtcNow
                    });

                    await repo.AddHistoryAsync(new TrackingHistory
                    {
                        TrackingId = Guid.NewGuid(),
                        TrackingNumber = e.TrackingNumber,
                        Status = e.Status,
                        Location = e.Location,
                        Timestamp = DateTime.UtcNow,
                        Remarks = e.Remarks
                    });
                }
            }

            _channel.BasicAck(ea.DeliveryTag, false);
        };

        _channel.BasicConsume("tracking_queue", false, consumer);

        return Task.CompletedTask;
    }
}