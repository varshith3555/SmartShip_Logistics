using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using SmartShip.Contracts.Events;
using SmartShip.DocumentService.Data;
using SmartShip.DocumentService.Models;

namespace SmartShip.DocumentService.Services;

/// <summary>
/// Choreography-saga participant: when booking is initiated, generate a label document.
/// Publishes success/failure events to RabbitMQ.
/// </summary>
public sealed class ShipmentBookingSagaConsumer : BackgroundService
{
    private const string ExchangeName = "smartship_events";
    private const string QueueName = "document_saga_queue";

    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ShipmentBookingSagaConsumer> _logger;
    private readonly string? _publicBaseUrl;

    public ShipmentBookingSagaConsumer(IServiceProvider serviceProvider, IConfiguration configuration, ILogger<ShipmentBookingSagaConsumer> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
        _publicBaseUrl = configuration["AppSettings:BaseUrl"]?.TrimEnd('/');
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Keep trying to connect so the service can still boot even if RabbitMQ is briefly down.
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var connection = CreateConnection();
                using var channel = connection.CreateModel();

                channel.ExchangeDeclare(ExchangeName, ExchangeType.Direct);
                channel.QueueDeclare(QueueName, durable: true, exclusive: false, autoDelete: false);
                channel.QueueBind(QueueName, ExchangeName, nameof(ShipmentBookingInitiatedEvent));

                var consumer = new AsyncEventingBasicConsumer(channel);
                consumer.Received += async (_, ea) => await HandleMessageAsync(channel, ea, stoppingToken);

                channel.BasicConsume(queue: QueueName, autoAck: false, consumer: consumer);

                // Wait until cancellation is requested, or the connection drops.
                while (!stoppingToken.IsCancellationRequested && connection.IsOpen)
                {
                    await Task.Delay(TimeSpan.FromSeconds(2), stoppingToken);
                }
            }
            catch (OperationCanceledException)
            {
                // shutdown
                break;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Document saga consumer could not connect to RabbitMQ. Retrying...");
                try
                {
                    await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
                }
                catch (OperationCanceledException)
                {
                    break;
                }
            }
        }
    }

    private IConnection CreateConnection()
    {
        var factory = new ConnectionFactory
        {
            HostName = _configuration["RabbitMQ:Host"] ?? "localhost",
            UserName = _configuration["RabbitMQ:Username"] ?? "guest",
            Password = _configuration["RabbitMQ:Password"] ?? "guest",
            DispatchConsumersAsync = true
        };

        return factory.CreateConnection();
    }

    private async Task HandleMessageAsync(IModel channel, BasicDeliverEventArgs ea, CancellationToken stoppingToken)
    {
        try
        {
            var json = Encoding.UTF8.GetString(ea.Body.ToArray());
            var evt = JsonSerializer.Deserialize<ShipmentBookingInitiatedEvent>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (evt is null)
            {
                channel.BasicAck(ea.DeliveryTag, multiple: false);
                return;
            }

            using var scope = _serviceProvider.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<DocumentDbContext>();

            var labelDoc = await CreateOrGetLabelAsync(db, evt, stoppingToken);

            Publish(channel, new ShipmentLabelCreatedEvent
            {
                ShipmentId = evt.ShipmentId,
                TrackingNumber = evt.TrackingNumber,
                DocumentId = labelDoc.DocumentId,
                FileUrl = labelDoc.FileUrl
            });

            channel.BasicAck(ea.DeliveryTag, multiple: false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed handling {RoutingKey} in DocumentService", ea.RoutingKey);

            try
            {
                // Best-effort: inform other services so they can compensate (e.g., raise an admin exception)
                var json = Encoding.UTF8.GetString(ea.Body.ToArray());
                var evt = JsonSerializer.Deserialize<ShipmentBookingInitiatedEvent>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (evt is not null)
                {
                    Publish(channel, new ShipmentLabelCreationFailedEvent
                    {
                        ShipmentId = evt.ShipmentId,
                        TrackingNumber = evt.TrackingNumber,
                        Reason = ex.Message
                    });
                }
            }
            catch (Exception publishEx)
            {
                _logger.LogWarning(publishEx, "Failed publishing label-creation failure event");
            }

            // Ack to avoid poison-message infinite loops.
            channel.BasicAck(ea.DeliveryTag, multiple: false);
        }
    }

    private void Publish(IModel channel, IntegrationEvent evt)
    {
        var routingKey = evt.GetType().Name;
        channel.ExchangeDeclare(exchange: ExchangeName, type: ExchangeType.Direct);

        var json = JsonSerializer.Serialize((object)evt);
        var body = Encoding.UTF8.GetBytes(json);

        channel.BasicPublish(exchange: ExchangeName, routingKey: routingKey, basicProperties: null, body: body);
    }

    private async Task<Document> CreateOrGetLabelAsync(DocumentDbContext db, ShipmentBookingInitiatedEvent evt, CancellationToken ct)
    {
        var safeTracking = (evt.TrackingNumber ?? string.Empty).Trim();
        var fileName = $"Label_{safeTracking}.txt";

        var existing = await db.Documents
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.ShipmentId == evt.ShipmentId && d.FileType == "Label" && d.FileName == fileName, ct);

        if (existing is not null)
        {
            return existing;
        }

        var webRoot = ResolveWebRootPath();
        var labelsFolder = Path.Combine(webRoot, "uploads", "labels");
        Directory.CreateDirectory(labelsFolder);

        var uniqueFileName = $"{Guid.NewGuid()}_{fileName}";
        var fullPath = Path.Combine(labelsFolder, uniqueFileName);

        var contents = $"Shipment Label\nShipmentId: {evt.ShipmentId}\nTrackingNumber: {evt.TrackingNumber}\nHubId: {evt.HubId}\nGeneratedAtUtc: {DateTime.UtcNow:O}\n";
        await File.WriteAllTextAsync(fullPath, contents, ct);

        var relativeUrl = $"/uploads/labels/{uniqueFileName}";
        var publicUrl = ToPublicUrl(relativeUrl);

        var doc = new Document
        {
            DocumentId = Guid.NewGuid(),
            ShipmentId = evt.ShipmentId,
            CustomerId = evt.CustomerId,
            FileName = fileName,
            FileType = "Label",
            FileUrl = publicUrl,
            UploadedAt = DateTime.UtcNow
        };

        db.Documents.Add(doc);
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("Auto-generated label for ShipmentId {ShipmentId} TrackingNumber {TrackingNumber}", evt.ShipmentId, evt.TrackingNumber);

        return doc;
    }

    private string ResolveWebRootPath()
    {
        // Works both in IIS/Kestrel and in tests/console runs.
        var basePath = Directory.GetCurrentDirectory();
        return Path.Combine(basePath, "wwwroot");
    }

    private string ToPublicUrl(string relativePath)
    {
        if (string.IsNullOrWhiteSpace(relativePath))
            return relativePath;

        if (string.IsNullOrWhiteSpace(_publicBaseUrl))
            return relativePath;

        var normalized = relativePath.StartsWith('/') ? relativePath : "/" + relativePath;
        return _publicBaseUrl + normalized;
    }
}
