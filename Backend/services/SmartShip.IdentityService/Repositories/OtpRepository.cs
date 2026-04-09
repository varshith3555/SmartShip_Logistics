using Microsoft.EntityFrameworkCore;
using SmartShip.IdentityService.Data;
using SmartShip.IdentityService.Models;

namespace SmartShip.IdentityService.Repositories;

public class OtpRepository : IOtpRepository
{
    private readonly IdentityDbContext _context;

    public OtpRepository(IdentityDbContext context)
    {
        _context = context;
    }

    public async Task<OtpVerification?> GetOtpByEmailAsync(string email)
    {
        return await GetLatestOtpByEmailAsync(email);
    }

    public async Task<OtpVerification?> GetLatestOtpByEmailAsync(string email)
    {
        var normalizedEmail = email.ToLower();
        return await _context.OtpVerifications
            .Where(o => o.Email == normalizedEmail)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<OtpVerification?> GetActiveOtpByEmailAsync(string email)
    {
        var normalizedEmail = email.ToLower();
        return await _context.OtpVerifications
            .Where(o => o.Email == normalizedEmail
                && !o.IsUsed
                && o.ExpiryTime > DateTime.UtcNow
                && o.AttemptCount < 3)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task SaveOtpAsync(OtpVerification otp)
    {
        _context.OtpVerifications.Add(otp);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateOtpAsync(OtpVerification otp)
    {
        _context.OtpVerifications.Update(otp);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteOtpAsync(Guid otpId)
    {
        var otp = await _context.OtpVerifications.FindAsync(otpId);
        if (otp != null)
        {
            _context.OtpVerifications.Remove(otp);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<PasswordResetToken?> GetPasswordResetTokenByEmailAsync(string email)
    {
        var normalizedEmail = email.ToLower();
        return await _context.PasswordResetTokens
            .Where(p => p.Email == normalizedEmail)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task<PasswordResetToken?> GetActivePasswordResetTokenByEmailAsync(string email)
    {
        var normalizedEmail = email.ToLower();
        return await _context.PasswordResetTokens
            .Where(p => p.Email == normalizedEmail
                && !p.IsUsed
                && p.ExpiryTime > DateTime.UtcNow
                && p.AttemptCount < 3)
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task SavePasswordResetTokenAsync(PasswordResetToken token)
    {
        _context.PasswordResetTokens.Add(token);
        await _context.SaveChangesAsync();
    }

    public async Task UpdatePasswordResetTokenAsync(PasswordResetToken token)
    {
        _context.PasswordResetTokens.Update(token);
        await _context.SaveChangesAsync();
    }

    public async Task DeletePasswordResetTokenAsync(Guid tokenId)
    {
        var token = await _context.PasswordResetTokens.FindAsync(tokenId);
        if (token != null)
        {
            _context.PasswordResetTokens.Remove(token);
            await _context.SaveChangesAsync();
        }
    }
}
