using System.Net.Http;

namespace SmartShip.Gateway.Correlation;

/// <summary>
/// Adds the current request correlation ID header to outbound <see cref="HttpClient"/> calls.
/// </summary>
public sealed class CorrelationIdDelegatingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CorrelationIdDelegatingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    /// <summary>
    /// Sends the request and ensures the correlation ID header is propagated when available.
    /// </summary>
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var context = _httpContextAccessor.HttpContext;
        var correlationId = context?.Request.Headers[CorrelationIdConstants.HeaderName].ToString();

        if (!string.IsNullOrWhiteSpace(correlationId) && !request.Headers.Contains(CorrelationIdConstants.HeaderName))
        {
            request.Headers.TryAddWithoutValidation(CorrelationIdConstants.HeaderName, correlationId);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
