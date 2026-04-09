namespace SmartShip.Core.Correlation;

public interface ICorrelationIdAccessor
{
    string? CorrelationId { get; }

    IDisposable BeginScope(string correlationId);
}
