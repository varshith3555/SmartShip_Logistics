using SmartShip.Core.Email;
using Microsoft.Extensions.Logging;

namespace SmartShip.IdentityService.Services;

public class OtpService : IOtpService
{
    private readonly IEmailService _emailService;
    private readonly ILogger<OtpService> _logger;

    public OtpService(IEmailService emailService, ILogger<OtpService> logger)
    {
        _emailService = emailService;
        _logger = logger;
    }

    public string GenerateOtp()
    {
        // Generate 6-digit OTP
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }

    public string HashOtp(string otp)
    {
        // Hash OTP using BCrypt for security
        return BCrypt.Net.BCrypt.HashPassword(otp);
    }

    public bool VerifyOtp(string otp, string hashedOtp)
    {
        try
        {
            return BCrypt.Net.BCrypt.Verify(otp, hashedOtp);
        }
        catch
        {
            return false;
        }
    }

    public async Task<bool> SendOtpEmailAsync(string email, string otp)
    {
        try
        {
            return await _emailService.SendOtpEmailAsync(email, otp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send OTP email to {Email}", email);
            return false;
        }
    }

    public async Task<bool> SendPasswordResetEmailAsync(string email, string otp)
    {
        try
        {
            return await _emailService.SendPasswordResetEmailAsync(email, otp);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
            return false;
        }
    }
}
