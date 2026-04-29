namespace SmartShip.IdentityService.Services;

/// <summary>
/// OTP helper service abstraction (generate/hash/verify and email delivery).
/// </summary>
public interface IOtpService
{
    string GenerateOtp();
    string HashOtp(string otp);
    bool VerifyOtp(string otp, string hashedOtp);
    Task<bool> SendOtpEmailAsync(string email, string otp);
    Task<bool> SendPasswordResetEmailAsync(string email, string otp);
}
