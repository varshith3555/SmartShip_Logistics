namespace SmartShip.IdentityService.Services;

public interface IOtpService
{
    string GenerateOtp();
    string HashOtp(string otp);
    bool VerifyOtp(string otp, string hashedOtp);
    Task<bool> SendOtpEmailAsync(string email, string otp);
    Task<bool> SendPasswordResetEmailAsync(string email, string otp);
}
