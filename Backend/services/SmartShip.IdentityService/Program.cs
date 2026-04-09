using Microsoft.EntityFrameworkCore;
using SmartShip.Core.Authentication;
using SmartShip.Core.Correlation;
using SmartShip.Core.Exceptions;
using SmartShip.Core.Email;
using SmartShip.IdentityService.Data;
using SmartShip.IdentityService.Repositories;
using SmartShip.IdentityService.Services;
using Serilog;
using Microsoft.Extensions.Logging;
using SmartShip.Core.Serialization;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.HttpOverrides;

var builder = WebApplication.CreateBuilder(args);

var serilogEnabled = builder.Configuration.GetValue("Serilog:Enabled", true);

// Configure Serilog (can be disabled via Serilog:Enabled=false)
if (!serilogEnabled)
{
    builder.Logging.ClearProviders();
    Log.Logger = new LoggerConfiguration()
        .MinimumLevel.Fatal()
    .WriteTo.Sink(SmartShip.Core.Logging.DiscardingSink.Instance)
        .Enrich.WithProperty("Service", "IdentityService")
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
            path: "logs/identity-service-.txt",
            rollingInterval: RollingInterval.Day,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}")
        .Enrich.WithProperty("Service", "IdentityService")
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
        options.SwaggerDoc("v1", new() { Title = "SmartShip.IdentityService", Version = "v1" });

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

    var identityConnString = builder.Configuration.GetConnectionString("IdentityConnDb")
        ?? throw new InvalidOperationException("Connection string 'IdentityConnDb' not found.");

    builder.Services.AddDbContext<IdentityDbContext>(options =>
        options.UseSqlServer(identityConnString));

    // Register Repositories
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IOtpRepository, OtpRepository>();

    // Register Services
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<IOtpService, OtpService>();
    builder.Services.AddSingleton<IEmailService, EmailService>();

    builder.Services.AddJwtAuthentication(builder.Configuration);

    // External OAuth (Google) - additive and does not change existing JWT auth defaults.
    // IMPORTANT: Keep it optional so missing ClientId/Secret does not break existing endpoints.
    var externalAuth = builder.Services.AddAuthentication();

    externalAuth.AddCookie("External", options =>
    {
        options.Cookie.Name = "SmartShip.External";
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
    });

    var googleClientId = builder.Configuration["GoogleOAuth:ClientId"];
    var googleClientSecret = builder.Configuration["GoogleOAuth:ClientSecret"];
    if (!string.IsNullOrWhiteSpace(googleClientId) && !string.IsNullOrWhiteSpace(googleClientSecret))
    {
        externalAuth.AddGoogle("Google", options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;

            // Callback must be a public, browser-reachable path.
            // Since auth flows go through the API Gateway, keep the callback on the gateway path.
            options.CallbackPath = "/gateway/auth/google/callback";
            options.SignInScheme = "External";

            // Support HTTP localhost dev (avoid SameSite=None + Secure requirement).
            options.CorrelationCookie.SameSite = SameSiteMode.Lax;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
        });
    }

    builder.Services.AddCorrelationId();

    var app = builder.Build();

    // Honor proxy/gateway forwarded headers so redirect URIs are built with the public host/scheme.
    var forwardedHeadersOptions = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedHost | ForwardedHeaders.XForwardedProto
    };
    forwardedHeadersOptions.KnownNetworks.Clear();
    forwardedHeadersOptions.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedHeadersOptions);

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

    // Run migrations
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<IdentityDbContext>();
        db.Database.Migrate();
    }

    Log.Information("SmartShip.IdentityService is starting");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "SmartShip.IdentityService terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
