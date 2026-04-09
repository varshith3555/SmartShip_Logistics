using System.Text.Json;
using System.Text.Json.Serialization;

namespace SmartShip.IdentityService.DTOs;

/// <summary>
/// Backward-compatible refresh token request.
/// Accepts either a raw JSON string body: "token" OR an object: { "refreshToken": "token" }.
/// </summary>
[JsonConverter(typeof(RefreshTokenRequestJsonConverter))]
public class RefreshTokenRequest
{
    public string RefreshToken { get; set; } = string.Empty;
}

internal sealed class RefreshTokenRequestJsonConverter : JsonConverter<RefreshTokenRequest>
{
    public override RefreshTokenRequest Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var token = reader.GetString();
            return new RefreshTokenRequest { RefreshToken = token ?? string.Empty };
        }

        if (reader.TokenType == JsonTokenType.StartObject)
        {
            using var doc = JsonDocument.ParseValue(ref reader);
            if (doc.RootElement.TryGetProperty("refreshToken", out var rt) && rt.ValueKind == JsonValueKind.String)
            {
                return new RefreshTokenRequest { RefreshToken = rt.GetString() ?? string.Empty };
            }

            if (doc.RootElement.TryGetProperty("RefreshToken", out var rt2) && rt2.ValueKind == JsonValueKind.String)
            {
                return new RefreshTokenRequest { RefreshToken = rt2.GetString() ?? string.Empty };
            }

            return new RefreshTokenRequest();
        }

        // Anything else (null, number, etc.) => empty token.
        reader.Skip();
        return new RefreshTokenRequest();
    }

    public override void Write(Utf8JsonWriter writer, RefreshTokenRequest value, JsonSerializerOptions options)
    {
        writer.WriteStartObject();
        writer.WriteString("refreshToken", value.RefreshToken);
        writer.WriteEndObject();
    }
}
