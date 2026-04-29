using Microsoft.EntityFrameworkCore;
using SmartShip.Core.Authentication;
using SmartShip.Core.Correlation;
using SmartShip.Core.Exceptions;
using SmartShip.TrackingService.Data;
using SmartShip.TrackingService.Repositories;
using SmartShip.TrackingService.Services;
using Serilog;
using SmartShip.Core.Logging;
using SmartShip.Core.Serialization;

var builder = WebApplication.CreateBuilder(args);

var serilogEnabled = builder.Configuration.GetValue("Serilog:Enabled", true);

var logDir = LogDirectory.Resolve(builder.Configuration);
LogDirectory.MigrateLegacyBinLogs(logDir);

// Configure Serilog (can be disabled via Serilog:Enabled=false)
if (!serilogEnabled)
{
    builder.Logging.ClearProviders();
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Fatal()
    .WriteTo.Sink(SmartShip.Core.Logging.DiscardingSink.Instance)
        .Enrich.WithProperty("Service", "TrackingService")
        .Enrich.FromLogContext()
        .CreateLogger();
}
else
{
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Information()
        .WriteTo.Console()
        .WriteTo.File(
            path: Path.Combine(logDir, "tracking-service-.txt"),
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .Enrich.WithProperty("Service", "TrackingService")
        .Enrich.FromLogContext()
        .CreateLogger();
}

builder.Host.UseSerilog();

try
{

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
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

var trackingConnString = builder.Configuration.GetConnectionString("TrackingConnDb")
    ?? throw new InvalidOperationException("Connection string 'TrackingConnDb' not found.");

builder.Services.AddDbContext<TrackingDbContext>(options =>
    options.UseSqlServer(trackingConnString));

builder.Services.AddScoped<ITrackingRepository, TrackingRepository>();
builder.Services.AddScoped<ITrackingService, SmartShip.TrackingService.Services.TrackingService>();

builder.Services.AddHostedService<TrackingEventConsumer>();

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
    var db = scope.ServiceProvider.GetRequiredService<TrackingDbContext>();
    db.Database.Migrate();
}

Log.Information("SmartShip.TrackingService is starting");
app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartShip.TrackingService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
