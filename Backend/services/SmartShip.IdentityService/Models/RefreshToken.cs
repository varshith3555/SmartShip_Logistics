namespace SmartShip.IdentityService.Models;

public class RefreshToken
{
    public Guid TokenId { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public User User { get; set; } = null!;
}
