namespace SmartShip.IdentityService.Models;

public class OtpVerification
{
    public Guid OtpId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string OtpCode { get; set; } = string.Empty; // Hashed OTP

    // Pending signup data (used to create user only after OTP verification)
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = "CUSTOMER";
    public string PasswordHash { get; set; } = string.Empty; // Hashed password

    public DateTime ExpiryTime { get; set; }
    public bool IsUsed { get; set; } = false;
    public int AttemptCount { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
}
