using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Http;

namespace SmartShip.Core.Correlation;

internal sealed class CorrelationIdHttpMessageHandlerBuilderFilter : IHttpMessageHandlerBuilderFilter
{
    private readonly IServiceProvider _serviceProvider;

    public CorrelationIdHttpMessageHandlerBuilderFilter(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public Action<HttpMessageHandlerBuilder> Configure(Action<HttpMessageHandlerBuilder> next)
    {
        return builder =>
        {
            next(builder);

            // Attach to ALL HttpClientFactory-created clients.
            var handler = _serviceProvider.GetRequiredService<CorrelationIdDelegatingHandler>();
            builder.AdditionalHandlers.Add(handler);
        };
    }
}
