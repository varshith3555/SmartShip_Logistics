using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using MMLib.SwaggerForOcelot.DependencyInjection;
using MMLib.SwaggerForOcelot.Middleware;
using SmartShip.Gateway.Correlation;

var builder = WebApplication.CreateBuilder(args);

var loggingEnabled = builder.Configuration.GetValue("Logging:Enabled", true);
if (!loggingEnabled)
{
    builder.Logging.ClearProviders();
}

// Load ocelot.json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddControllers();

builder.Services.AddHttpContextAccessor();
builder.Services.AddTransient<CorrelationIdDelegatingHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOcelot(builder.Configuration)
    .AddDelegatingHandler<CorrelationIdDelegatingHandler>(global: true);
builder.Services.AddSwaggerGen();
builder.Services.AddSwaggerForOcelot(builder.Configuration);

var app = builder.Build();

// Propagate the public-facing host/proto to downstream services (needed for OAuth redirect URIs).
app.Use((context, next) =>
{
    context.Request.Headers["X-Forwarded-Host"] = context.Request.Host.Value;
    context.Request.Headers["X-Forwarded-Proto"] = context.Request.Scheme;
    return next();
});

app.UseMiddleware<CorrelationIdMiddleware>();

app.UseCors("AllowFrontend");

// Swagger UI for Gateway
app.UseSwaggerForOcelotUI(opt =>
{
    opt.PathToSwaggerGenerator = "/swagger/docs";
});

// Ocelot middleware
await app.UseOcelot();

app.Run();