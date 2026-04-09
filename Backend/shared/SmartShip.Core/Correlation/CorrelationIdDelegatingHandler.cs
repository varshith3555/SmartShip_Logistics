using System.Net.Http;

namespace SmartShip.Core.Correlation;

public sealed class CorrelationIdDelegatingHandler : DelegatingHandler
{
    private readonly ICorrelationIdAccessor _correlationIdAccessor;

    public CorrelationIdDelegatingHandler(ICorrelationIdAccessor correlationIdAccessor)
    {
        _correlationIdAccessor = correlationIdAccessor;
    }

    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var correlationId = _correlationIdAccessor.CorrelationId;
        if (!string.IsNullOrWhiteSpace(correlationId) && !request.Headers.Contains(CorrelationIdConstants.HeaderName))
        {
            request.Headers.TryAddWithoutValidation(CorrelationIdConstants.HeaderName, correlationId);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
