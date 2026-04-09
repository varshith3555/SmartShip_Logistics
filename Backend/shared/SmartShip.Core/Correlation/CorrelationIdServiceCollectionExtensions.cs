using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Http;

namespace SmartShip.Core.Correlation;

public static class CorrelationIdServiceCollectionExtensions
{
    public static IServiceCollection AddCorrelationId(this IServiceCollection services)
    {
        services.TryAddSingleton<ICorrelationIdAccessor, CorrelationIdAccessor>();

        services.TryAddTransient<CorrelationIdDelegatingHandler>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IHttpMessageHandlerBuilderFilter, CorrelationIdHttpMessageHandlerBuilderFilter>());

        return services;
    }
}
