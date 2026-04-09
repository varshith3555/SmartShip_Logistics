namespace SmartShip.Core.Authentication;

public class JwtSettings
{
    public string Secret { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public List<string> Audiences { get; set; } = new();
    public string? Aud1 { get; set; }
    public string? Aud2 { get; set; }
    public int ExpiryMinutes { get; set; } = 60;
}
