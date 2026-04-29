namespace SmartShip.Core.Correlation;

/// <summary>
/// Shared constants for correlation ID header, logging property, and context key.
/// </summary>
public static class CorrelationIdConstants
{
    public const string HeaderName = "X-Correlation-ID";
    public const string HttpContextItemKey = "CorrelationId";
    public const string LogPropertyName = "CorrelationId";
}
