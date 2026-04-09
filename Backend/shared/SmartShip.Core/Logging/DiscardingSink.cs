using Serilog.Core;
using Serilog.Events;

namespace SmartShip.Core.Logging;

public sealed class DiscardingSink : ILogEventSink
{
    public static readonly DiscardingSink Instance = new();

    private DiscardingSink()
    {
    }

    public void Emit(LogEvent logEvent)
    {
        // Intentionally discard all log events.
    }
}
