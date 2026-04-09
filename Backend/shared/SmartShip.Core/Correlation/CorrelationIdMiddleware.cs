using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using Serilog.Context;

namespace SmartShip.Core.Correlation;

public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<CorrelationIdMiddleware> _logger;

    public CorrelationIdMiddleware(RequestDelegate next, ILogger<CorrelationIdMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context, ICorrelationIdAccessor correlationIdAccessor)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        // Ensure it is available for downstream middleware/controllers.
        context.Items[CorrelationIdConstants.HttpContextItemKey] = correlationId;
        context.Request.Headers[CorrelationIdConstants.HeaderName] = correlationId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdConstants.HeaderName] = correlationId;
            return Task.CompletedTask;
        });

        using var _ = correlationIdAccessor.BeginScope(correlationId);
        using var __ = LogContext.PushProperty(CorrelationIdConstants.LogPropertyName, correlationId);

        _logger.LogDebug("CorrelationId set: {CorrelationId}", correlationId);

        await _next(context);
    }

    private static string GetOrCreateCorrelationId(HttpContext context)
    {
        if (context.Request.Headers.TryGetValue(CorrelationIdConstants.HeaderName, out StringValues values))
        {
            var existing = values.ToString();
            if (!string.IsNullOrWhiteSpace(existing))
            {
                return existing;
            }
        }

        return Guid.NewGuid().ToString();
    }
}
