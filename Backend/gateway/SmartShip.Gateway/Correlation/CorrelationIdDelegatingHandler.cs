using System.Net.Http;

namespace SmartShip.Gateway.Correlation;

public sealed class CorrelationIdDelegatingHandler : DelegatingHandler
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CorrelationIdDelegatingHandler(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

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
