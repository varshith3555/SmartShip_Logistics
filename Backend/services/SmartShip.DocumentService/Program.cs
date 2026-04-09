using Microsoft.EntityFrameworkCore;
using SmartShip.Core.Authentication;
using SmartShip.Core.Correlation;
using SmartShip.Core.Exceptions;
using SmartShip.DocumentService.Data;
using SmartShip.DocumentService.Repositories;
using SmartShip.DocumentService.Services;
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
        .Enrich.WithProperty("Service", "DocumentService")
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
            path: "logs/document-service-.txt",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .Enrich.WithProperty("Service", "DocumentService")
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

var documentConnString = builder.Configuration.GetConnectionString("DocumentConnDb")
    ?? throw new InvalidOperationException("Connection string 'DocumentConnDb' not found.");

builder.Services.AddDbContext<DocumentDbContext>(options =>
    options.UseSqlServer(documentConnString));

builder.Services.AddScoped<IDocumentRepository, DocumentRepository>();
builder.Services.AddScoped<IDocumentService, SmartShip.DocumentService.Services.DocumentService>();

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

app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DocumentDbContext>();
    db.Database.Migrate();
}

Log.Information("SmartShip.DocumentService is starting");
app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartShip.DocumentService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
