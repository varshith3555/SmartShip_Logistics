using Microsoft.EntityFrameworkCore;
using SmartShip.AdminService.Data;
using SmartShip.AdminService.Repositories;
using SmartShip.AdminService.Services;
using SmartShip.Core.Authentication;
using SmartShip.Core.Correlation;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Messaging;
using SmartShip.Core.Serialization;
using Serilog;
using Microsoft.Extensions.Logging;


var builder = WebApplication.CreateBuilder(args);

var serilogEnabled = builder.Configuration.GetValue("Serilog:Enabled", true);

// Configure Serilog (can be disabled via Serilog:Enabled=false)
if (!serilogEnabled)
{
    builder.Logging.ClearProviders();
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Fatal()
    .WriteTo.Sink(SmartShip.Core.Logging.DiscardingSink.Instance)
        .Enrich.WithProperty("Service", "AdminService")
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
            path: "logs/admin-service-.txt",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .Enrich.WithProperty("Service", "AdminService")
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
        options.JsonSerializerOptions.Converters.Add(new UtcDateTimeJsonConverter());
    });

builder.Services.AddHttpContextAccessor();

var shipmentServiceBaseUrl = builder.Configuration["DownstreamServices:ShipmentServiceBaseUrl"]
    ?? "http://localhost:5002";

builder.Services.AddHttpClient("ShipmentService", client =>
{
    client.BaseAddress = new Uri(shipmentServiceBaseUrl.TrimEnd('/') + "/");
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
        Description = "Enter: Bearer <your_token>"
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

var adminConnString = builder.Configuration.GetConnectionString("AdminConnDb")
    ?? throw new InvalidOperationException("Connection string 'AdminConnDb' not found.");

builder.Services.AddDbContext<AdminDbContext>(options =>
    options.UseSqlServer(adminConnString));

builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<IAdminService, SmartShip.AdminService.Services.AdminService>();

// Choreography-saga participant: reacts to downstream failures
builder.Services.AddHostedService<ShipmentLabelFailureConsumer>();

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
    var db = scope.ServiceProvider.GetRequiredService<AdminDbContext>();
    db.Database.Migrate();

    try
    {
        AdminDbSeeder.Seed(db);
    }
    catch (Exception ex)
    {
        Log.Error(ex, "Admin DB seeding failed");
    }
}

Log.Information("SmartShip.AdminService is starting");
app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartShip.AdminService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
