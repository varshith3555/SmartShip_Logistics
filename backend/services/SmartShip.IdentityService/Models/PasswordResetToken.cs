namespace SmartShip.IdentityService.Models;

/// <summary>
/// Password reset token entity (OTP-based) with expiry and attempt tracking.
/// </summary>
public class PasswordResetToken
{
    public Guid TokenId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty; // Hashed OTP
    public DateTime ExpiryTime { get; set; }
    public bool IsUsed { get; set; } = false;
    public int AttemptCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
}
