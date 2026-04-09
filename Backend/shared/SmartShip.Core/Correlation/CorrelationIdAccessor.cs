using System.Threading;

namespace SmartShip.Core.Correlation;

internal sealed class CorrelationIdAccessor : ICorrelationIdAccessor
{
    private static readonly AsyncLocal<string?> CurrentCorrelationId = new();

    public string? CorrelationId => CurrentCorrelationId.Value;

    public IDisposable BeginScope(string correlationId)
    {
        var previous = CurrentCorrelationId.Value;
        CurrentCorrelationId.Value = correlationId;
        return new RestoreScope(previous);
    }

    private sealed class RestoreScope : IDisposable
    {
        private readonly string? _previous;
        private bool _disposed;

        public RestoreScope(string? previous)
        {
            _previous = previous;
        }

        public void Dispose()
        {
            if (_disposed) return;
            CurrentCorrelationId.Value = _previous;
            _disposed = true;
        }
    }
}
