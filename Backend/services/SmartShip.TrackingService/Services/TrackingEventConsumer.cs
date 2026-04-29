using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SmartShip.Contracts.Events;
using SmartShip.TrackingService.Models;
using SmartShip.TrackingService.Repositories;
using Microsoft.Extensions.Logging;

namespace SmartShip.TrackingService.Services;

/// <summary>
/// Background service that consumes shipment/tracking events from RabbitMQ and updates tracking state.
/// </summary>
public class TrackingEventConsumer : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _config;
    private readonly ILogger<TrackingEventConsumer> _logger;

    public TrackingEventConsumer(IServiceProvider serviceProvider, IConfiguration config, ILogger<TrackingEventConsumer> logger)
    {
        _serviceProvider = serviceProvider;
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Starts consuming events and applying them to the tracking repository.
    /// </summary>
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Keep retrying connection so the HTTP API can still start even if RabbitMQ isn't running locally.
        // This avoids the entire TrackingService crashing during host startup.
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var factory = new ConnectionFactory
                {
                    HostName = _config["RabbitMQ:Host"] ?? "localhost",
                    UserName = _config["RabbitMQ:Username"] ?? "guest",
                    Password = _config["RabbitMQ:Password"] ?? "guest",
                    DispatchConsumersAsync = true,
                    AutomaticRecoveryEnabled = true
                };

                using var connection = factory.CreateConnection("SmartShip.TrackingService");
                using var channel = connection.CreateModel();

                channel.ExchangeDeclare("smartship_events", ExchangeType.Direct);
                channel.QueueDeclare("tracking_queue", true, false, false);
                channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentCreatedEvent));
                channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentBookedEvent));
                channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentDeliveredEvent));
                channel.QueueBind("tracking_queue", "smartship_events", nameof(TrackingUpdatedEvent));
                channel.QueueBind("tracking_queue", "smartship_events", nameof(ShipmentLabelCreatedEvent));

                var stoppedTcs = new TaskCompletionSource<object?>(TaskCreationOptions.RunContinuationsAsynchronously);
                void Stop(string reason)
                {
                    if (!stoppedTcs.Task.IsCompleted)
                    {
                        _logger.LogWarning("TrackingEventConsumer stopping consumption: {Reason}", reason);
                        stoppedTcs.TrySetResult(null);
                    }
                }

                connection.ConnectionShutdown += (_, ea) => Stop($"RabbitMQ connection shutdown: {ea.ReplyText}");
                connection.CallbackException += (_, ea) => Stop($"RabbitMQ connection exception: {ea.Exception.Message}");
                channel.ModelShutdown += (_, ea) => Stop($"RabbitMQ channel shutdown: {ea.ReplyText}");
                channel.CallbackException += (_, ea) => Stop($"RabbitMQ channel exception: {ea.Exception.Message}");

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.Received += async (_, ea) =>
                {
                    try
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
                                    CurrentStatus = "DRAFT",
                                    UpdatedAt = DateTime.UtcNow
                                });

                                await repo.AddHistoryAsync(new TrackingHistory
                                {
                                    TrackingId = Guid.NewGuid(),
                                    TrackingNumber = e.TrackingNumber,
                                    Status = "DRAFT",
                                    Location = "System",
                                    Timestamp = DateTime.UtcNow,
                                    Remarks = "Shipment Draft Created"
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
                        else if (routingKey == nameof(ShipmentLabelCreatedEvent))
                        {
                            var e = JsonSerializer.Deserialize<ShipmentLabelCreatedEvent>(message);
                            if (e != null)
                            {
                                await repo.AddHistoryAsync(new TrackingHistory
                                {
                                    TrackingId = Guid.NewGuid(),
                                    TrackingNumber = e.TrackingNumber,
                                    Status = "LABEL_GENERATED",
                                    Location = "DocumentService",
                                    Timestamp = DateTime.UtcNow,
                                    Remarks = $"Shipping label generated ({e.DocumentId})"
                                });
                            }
                        }

                        channel.BasicAck(ea.DeliveryTag, false);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Failed processing RabbitMQ message {RoutingKey}", ea.RoutingKey);
                        // Avoid poison-pill loops. Requeue = false.
                        channel.BasicNack(ea.DeliveryTag, multiple: false, requeue: false);
                    }
                };

                channel.BasicConsume("tracking_queue", false, consumer);
                _logger.LogInformation("TrackingEventConsumer consuming RabbitMQ events");

                using var reg = stoppingToken.Register(() => Stop("Cancellation requested"));
                await stoppedTcs.Task;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "RabbitMQ not reachable; will retry");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    // ignore
                }
            }
        }
    }
}