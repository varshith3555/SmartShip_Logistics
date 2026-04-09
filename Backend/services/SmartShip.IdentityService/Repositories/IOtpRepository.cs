namespace SmartShip.IdentityService.Repositories;

using SmartShip.IdentityService.Models;

public interface IOtpRepository
{
    Task<OtpVerification?> GetOtpByEmailAsync(string email);
    Task<OtpVerification?> GetLatestOtpByEmailAsync(string email);
    Task<OtpVerification?> GetActiveOtpByEmailAsync(string email);
    
    Task SaveOtpAsync(OtpVerification otp);
    Task UpdateOtpAsync(OtpVerification otp);
    Task DeleteOtpAsync(Guid otpId);
    
    Task<PasswordResetToken?> GetPasswordResetTokenByEmailAsync(string email);
    Task<PasswordResetToken?> GetActivePasswordResetTokenByEmailAsync(string email);
    
    Task SavePasswordResetTokenAsync(PasswordResetToken token);
    Task UpdatePasswordResetTokenAsync(PasswordResetToken token);
    Task DeletePasswordResetTokenAsync(Guid tokenId);
}
