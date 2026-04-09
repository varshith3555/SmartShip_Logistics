using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace SmartShip.Gateway.Correlation;

public sealed class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var correlationId = GetOrCreateCorrelationId(context);

        context.Items[CorrelationIdConstants.HttpContextItemKey] = correlationId;
        context.Request.Headers[CorrelationIdConstants.HeaderName] = correlationId;

        context.Response.OnStarting(() =>
        {
            context.Response.Headers[CorrelationIdConstants.HeaderName] = correlationId;
            return Task.CompletedTask;
        });

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
