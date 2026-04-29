namespace SmartShip.Gateway.Correlation;

/// <summary>
/// Constants used for correlation ID propagation through the API Gateway.
/// </summary>
public static class CorrelationIdConstants
{
    public const string HeaderName = "X-Correlation-ID";
    public const string HttpContextItemKey = "CorrelationId";
}
