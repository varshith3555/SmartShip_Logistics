namespace SmartShip.Core.Correlation;

/// <summary>
/// Provides access to the current correlation ID and a scope for setting it.
/// </summary>
public interface ICorrelationIdAccessor
{
    string? CorrelationId { get; }

    /// <summary>
    /// Begins a scope that sets the current correlation ID for the duration of the scope.
    /// </summary>
    IDisposable BeginScope(string correlationId);
}
