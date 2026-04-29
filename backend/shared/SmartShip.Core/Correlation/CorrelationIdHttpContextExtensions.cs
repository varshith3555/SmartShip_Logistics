using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace SmartShip.Core.Correlation;

/// <summary>
/// Helper extensions for reading correlation ID values from an <see cref="HttpContext"/>.
/// </summary>
public static class CorrelationIdHttpContextExtensions
{
    /// <summary>
    /// Gets the correlation ID from <see cref="HttpContext.Items"/> or the request headers.
    /// </summary>
    public static string? GetCorrelationId(this HttpContext context)
    {
        if (context.Items.TryGetValue(CorrelationIdConstants.HttpContextItemKey, out var value)
            && value is string correlationIdFromItems
            && !string.IsNullOrWhiteSpace(correlationIdFromItems))
        {
            return correlationIdFromItems;
        }

        if (context.Request.Headers.TryGetValue(CorrelationIdConstants.HeaderName, out StringValues headerValues))
        {
            var headerValue = headerValues.ToString();
            if (!string.IsNullOrWhiteSpace(headerValue))
            {
                return headerValue;
            }
        }

        return null;
    }
}
