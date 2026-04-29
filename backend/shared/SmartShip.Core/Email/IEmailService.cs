namespace SmartShip.Core.Email;

/// <summary>
/// Abstraction for sending application emails (OTP/password reset).
/// </summary>
public interface IEmailService
{
    Task<bool> SendOtpEmailAsync(string recipientEmail, string otp);
    Task<bool> SendPasswordResetEmailAsync(string recipientEmail, string otp);
}
