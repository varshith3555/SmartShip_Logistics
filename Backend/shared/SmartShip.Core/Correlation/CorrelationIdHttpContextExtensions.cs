using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Primitives;

namespace SmartShip.Core.Correlation;

public static class CorrelationIdHttpContextExtensions
{
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
