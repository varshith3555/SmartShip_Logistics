using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Http;

namespace SmartShip.Core.Correlation;

/// <summary>
/// Dependency injection helpers for registering correlation ID services.
/// </summary>
public static class CorrelationIdServiceCollectionExtensions
{
    /// <summary>
    /// Registers correlation ID accessor plus HTTP client handler components.
    /// </summary>
    public static IServiceCollection AddCorrelationId(this IServiceCollection services)
    {
        services.TryAddSingleton<ICorrelationIdAccessor, CorrelationIdAccessor>();

        services.TryAddTransient<CorrelationIdDelegatingHandler>();
        services.TryAddEnumerable(ServiceDescriptor.Singleton<IHttpMessageHandlerBuilderFilter, CorrelationIdHttpMessageHandlerBuilderFilter>());

        return services;
    }
}
