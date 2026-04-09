using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SmartShip.Core.Serialization;

public sealed class UtcDateTimeJsonConverter : JsonConverter<DateTime>
{
    public override DateTime Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var s = reader.GetString();
        if (string.IsNullOrWhiteSpace(s)) return default;

        // Preserve offset/Z when present.
        return DateTime.Parse(s, CultureInfo.InvariantCulture, DateTimeStyles.RoundtripKind);
    }

    public override void Write(Utf8JsonWriter writer, DateTime value, JsonSerializerOptions options)
    {
        var utc = value.Kind switch
        {
            DateTimeKind.Utc => value,
            DateTimeKind.Local => value.ToUniversalTime(),
            // Many EF Core DateTime values come back as Unspecified; we treat them as UTC.
            _ => DateTime.SpecifyKind(value, DateTimeKind.Utc),
        };

        writer.WriteStringValue(utc.ToString("O", CultureInfo.InvariantCulture));
    }
}
