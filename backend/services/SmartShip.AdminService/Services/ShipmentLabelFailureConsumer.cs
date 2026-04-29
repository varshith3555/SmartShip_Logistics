using System.Text;
using System.Text.Json;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SmartShip.AdminService.Models;
using SmartShip.AdminService.Repositories;
using SmartShip.Contracts.Events;

namespace SmartShip.AdminService.Services;

/// <summary>
/// Choreography-saga participant: if label generation fails in DocumentService,
/// create an admin-visible shipment exception record.
/// </summary>
public sealed class ShipmentLabelFailureConsumer : BackgroundService
{
    private const string ExchangeName = "smartship_events";
    private const string QueueName = "admin_saga_queue";

    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ShipmentLabelFailureConsumer> _logger;

    private IConnection? _connection;
    private IModel? _channel;

    public ShipmentLabelFailureConsumer(IServiceProvider serviceProvider, IConfiguration configuration, ILogger<ShipmentLabelFailureConsumer> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
    }

    public override Task StartAsync(CancellationToken cancellationToken)
    {
        TryConnectAndConfigure();
        return base.StartAsync(cancellationToken);
    }

    protected override Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (_channel is null)
        {
            _logger.LogWarning("Admin saga consumer not started (RabbitMQ unavailable at startup)");
            return Task.CompletedTask;
        }

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.Received += async (_, ea) => await HandleAsync(ea, stoppingToken);

        _channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);
        return Task.CompletedTask;
    }

    private void TryConnectAndConfigure()
    {
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
                UserName = _configuration["RabbitMQ:Username"] ?? "guest",
                Password = _configuration["RabbitMQ:Password"] ?? "guest",
                DispatchConsumersAsync = true
            };

            _connection = factory.CreateConnection();
            _channel = _connection.CreateModel();

            _channel.ExchangeDeclare(ExchangeName, ExchangeType.Direct);
            _channel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);
            _channel.QueueBind(QueueName, ExchangeName, nameof(ShipmentLabelCreationFailedEvent));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Admin saga consumer failed to connect/configure RabbitMQ");
            _channel = null;
            _connection = null;
        }
    }

    private async Task HandleAsync(BasicDeliverEventArgs ea, CancellationToken ct)
    {
        if (_channel is null)
        {
            return;
        }

        try
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var evt = JsonSerializer.Deserialize<ShipmentLabelCreationFailedEvent>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (evt is null)
            {
                _channel.BasicAck(ea.DeliveryTag, multiple: false);
                return;
            }

            using var scope = _serviceProvider.CreateScope();
            var repo = scope.ServiceProvider.GetRequiredService<IAdminRepository>();

            // Idempotency: don't create multiple OPEN exceptions for the same shipment.
            var existing = await repo.GetExceptionByShipmentIdAsync(evt.ShipmentId);
            if (existing is null)
            {
                await repo.AddExceptionAsync(new ShipmentException
                {
                    ExceptionId = Guid.NewGuid(),
                    ShipmentId = evt.ShipmentId,
                    Type = "DOCUMENT_LABEL_FAILED",
                    Description = $"Auto-generated label creation failed for tracking {evt.TrackingNumber}. Reason: {evt.Reason}",
                    Status = "OPEN",
                    CreatedAt = DateTime.UtcNow
                });

                _logger.LogWarning("Created ShipmentException for ShipmentId {ShipmentId} due to label failure", evt.ShipmentId);
            }

            _channel.BasicAck(ea.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed processing admin saga message {RoutingKey}", ea.RoutingKey);
            _channel.BasicAck(ea.DeliveryTag, multiple: false);
        }
    }

    public override void Dispose()
    {
        try { _channel?.Dispose(); } catch { }
        try { _connection?.Dispose(); } catch { }
        base.Dispose();
    }
}
