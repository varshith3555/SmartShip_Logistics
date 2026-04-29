using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using SmartShip.Core.Authentication;
using SmartShip.Core.Correlation;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Messaging;
using SmartShip.ShipmentService.Data;
using SmartShip.ShipmentService.Repositories;
using SmartShip.ShipmentService.Services;
using Serilog;
using Microsoft.Extensions.Logging;
using SmartShip.Core.Serialization;

var builder = WebApplication.CreateBuilder(args);

var serilogEnabled = builder.Configuration.GetValue("Serilog:Enabled", true);

// Configure Serilog (can be disabled via Serilog:Enabled=false)
if (!serilogEnabled)
{
    builder.Logging.ClearProviders();
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Fatal()
    .WriteTo.Sink(SmartShip.Core.Logging.DiscardingSink.Instance)
        .Enrich.WithProperty("Service", "ShipmentService")
        .Enrich.FromLogContext()
        .CreateLogger();
}
else
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Information()
        .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", Serilog.Events.LogEventLevel.Warning)
        .WriteTo.Console()
        .WriteTo.File(
            path: "logs/shipment-service-.txt",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .Enrich.WithProperty("Service", "ShipmentService")
        .Enrich.FromLogContext()
        .CreateLogger();
}

builder.Host.UseSerilog();

try
{
    builder.Logging.AddFilter("Microsoft.EntityFrameworkCore.Database.Command", LogLevel.Warning);

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
        });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "Enter: Bearer <token>"
        });

        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
            }
        });
    });

    var shipmentConnString = builder.Configuration.GetConnectionString("ShipmentConnDb")
        ?? throw new InvalidOperationException("Connection string 'ShipmentConnDb' not found.");

    builder.Services.AddDbContext<ShipmentDbContext>(options =>
        options.UseSqlServer(shipmentConnString));

    builder.Services.AddScoped<IShipmentRepository, ShipmentRepository>();
    builder.Services.AddScoped<IShipmentService, SmartShip.ShipmentService.Services.ShipmentService>();

    var adminServiceBaseUrl = builder.Configuration["DownstreamServices:AdminServiceBaseUrl"]
        ?? "http://localhost:5005";

    builder.Services.AddHttpClient("AdminService", client =>
    {
        client.BaseAddress = new Uri(adminServiceBaseUrl.TrimEnd('/') + "/");
    });

    builder.Services.AddSingleton<IEventBus, RabbitMQService>();

    builder.Services.AddJwtAuthentication(builder.Configuration);

    builder.Services.AddCorrelationId();

    var app = builder.Build();

    app.UseMiddleware<CorrelationIdMiddleware>();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseMiddleware<GlobalExceptionHandler>();

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<ShipmentDbContext>();
        db.Database.Migrate();
    }

    Log.Information("SmartShip.ShipmentService is starting");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartShip.ShipmentService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
