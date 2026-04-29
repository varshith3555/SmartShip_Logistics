using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Logging;
using SmartShip.Core.Authentication;
using SmartShip.Core.Exceptions;
using SmartShip.IdentityService.DTOs;
using SmartShip.IdentityService.Models;
using SmartShip.IdentityService.Repositories;

namespace SmartShip.IdentityService.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepository;
    private readonly IOtpRepository _otpRepository;
    private readonly IOtpService _otpService;
    private readonly JwtSettings _jwtSettings;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepository,
        IOtpRepository otpRepository,
        IOtpService otpService,
        IOptions<JwtSettings> jwtOptions,
        ILogger<AuthService> logger)
    {
        _userRepository = userRepository;
        _otpRepository = otpRepository;
        _otpService = otpService;
        _jwtSettings = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Login attempt for email: {Email}", email);

        var user = await _userRepository.GetUserByEmailAsync(email);
        if (user == null || !VerifyPasswordHash(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for email: {Email}", email);
            throw new SmartShipUnauthorizedException("Invalid credentials");
        }

        _logger.LogInformation("Successful login for user: {UserId}", user.UserId);
        return await GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Standard signup attempt for email: {Email}", email);

        var existing = await _userRepository.GetUserByEmailAsync(email);
        if (existing != null)
        {
            _logger.LogWarning("Registration failed - email already exists: {Email}", email);
            throw new SmartShipBadRequestException("Email already in use");
        }

        // Public signup is always CUSTOMER (ignore request.Role)
        const string assignedRole = "CUSTOMER";

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = email,
            Name = request.Name,
            Phone = request.Phone,
            PasswordHash = CreatePasswordHash(request.Password),
            Role = assignedRole,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateUserAsync(user);
        _logger.LogInformation("User created successfully: {UserId} with email: {Email}", user.UserId, user.Email);

        return await GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> ExternalLoginAsync(string email, string name)
    {
        var normalizedEmail = NormalizeEmail(email);
        _logger.LogInformation("External login attempt for email: {Email}", normalizedEmail);

        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            throw new SmartShipBadRequestException("Email is required");
        }

        var user = await _userRepository.GetUserByEmailAsync(normalizedEmail);
        if (user == null)
        {
            // External signups must always result in CUSTOMER
            const string assignedRole = "CUSTOMER";

            // Generate a random password so the row satisfies non-null constraints.
            // Users can still reset/set a password later via existing flows.
            var randomPassword = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));

            user = new User
            {
                UserId = Guid.NewGuid(),
                Email = normalizedEmail,
                Name = string.IsNullOrWhiteSpace(name) ? normalizedEmail : name.Trim(),
                Phone = string.Empty,
                PasswordHash = CreatePasswordHash(randomPassword),
                Role = assignedRole,
                CreatedAt = DateTime.UtcNow
            };

            await _userRepository.CreateUserAsync(user);
            _logger.LogInformation("External user created successfully: {UserId} ({Email})", user.UserId, user.Email);
        }
        else if (string.IsNullOrWhiteSpace(user.Name) && !string.IsNullOrWhiteSpace(name))
        {
            user.Name = name.Trim();
            await _userRepository.UpdateUserAsync(user);
        }

        return await GenerateAuthResponse(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string token)
    {
        _logger.LogInformation("Refresh token request");

        var refreshToken = await _userRepository.GetRefreshTokenAsync(token);
        if (refreshToken == null || refreshToken.ExpiryDate <= DateTime.UtcNow)
        {
            _logger.LogWarning("Invalid or expired refresh token");
            throw new SmartShipUnauthorizedException("Invalid or expired refresh token");
        }

        return await GenerateAuthResponse(refreshToken.User);
    }

    public async Task<OtpResponse> SignupWithOtpAsync(SignupWithOtpRequest request)
    {
        if (request.Password != request.ConfirmPassword)
        {
            throw new SmartShipBadRequestException("Passwords do not match");
        }

        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("OTP signup request for email: {Email}", email);

        // Check if email already exists
        var existing = await _userRepository.GetUserByEmailAsync(email);
        if (existing != null)
        {
            _logger.LogWarning("OTP signup failed - email already exists: {Email}", email);
            throw new SmartShipBadRequestException("Email already in use");
        }

        // Check if there's already an active OTP (prevent multiple signup attempts)
        var activeOtp = await _otpRepository.GetActiveOtpByEmailAsync(email);
        if (activeOtp != null)
        {
            _logger.LogInformation("Active OTP already exists for email: {Email}", email);
            throw new SmartShipBadRequestException("An OTP is already sent to this email. Please verify it first.");
        }

        // Public signup must never allow role escalation
        const string assignedRole = "CUSTOMER";

        // Generate OTP
        var otp = _otpService.GenerateOtp();
        var hashedOtp = _otpService.HashOtp(otp);

        // Hash password before storing (security)
        var passwordHash = CreatePasswordHash(request.Password);

        // Store OTP with 5-minute expiry
        var otpVerification = new OtpVerification
        {
            OtpId = Guid.NewGuid(),
            Email = email,
            OtpCode = hashedOtp,
            Name = request.Name,
            Phone = request.Phone,
            Role = assignedRole,
            PasswordHash = passwordHash,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _otpRepository.SaveOtpAsync(otpVerification);

        // Send OTP email
        var emailSent = await _otpService.SendOtpEmailAsync(email, otp);
        if (!emailSent)
        {
            _logger.LogWarning("Failed to send OTP email to: {Email}", email);
            throw new SmartShipBadRequestException("Failed to send OTP. Please try again.");
        }

        _logger.LogInformation("OTP generated and sent successfully for email: {Email}", email);

        return new OtpResponse
        {
            Success = true,
            Message = "OTP sent"
        };
    }

    public async Task<OtpResponse> ResendOtpAsync(ResendOtpRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Resend OTP request for email: {Email}", email);

        // Allow resend even if the previous OTP is expired or locked (attempts exceeded)
        var existingOtp = await _otpRepository.GetLatestOtpByEmailAsync(email);
        if (existingOtp == null)
        {
            _logger.LogWarning("No OTP record found to resend for email: {Email}", email);
            throw new SmartShipBadRequestException("No OTP request found. Please signup again.");
        }

        // Preserve pending signup data, replace only OTP + expiry + attempt tracking
        var preservedName = existingOtp.Name;
        var preservedPhone = existingOtp.Phone;
        // Resend must not carry forward any elevated role from older OTP records
        const string preservedRole = "CUSTOMER";
        var preservedPasswordHash = existingOtp.PasswordHash;

        if (string.IsNullOrWhiteSpace(preservedName)
            || string.IsNullOrWhiteSpace(preservedPhone)
            || string.IsNullOrWhiteSpace(preservedPasswordHash))
        {
            _logger.LogWarning("OTP record missing pending signup data for email: {Email}", email);
            throw new SmartShipBadRequestException("Signup data not found. Please signup again.");
        }

        await _otpRepository.DeleteOtpAsync(existingOtp.OtpId);

        var otp = _otpService.GenerateOtp();
        var hashedOtp = _otpService.HashOtp(otp);

        var newOtpVerification = new OtpVerification
        {
            OtpId = Guid.NewGuid(),
            Email = email,
            OtpCode = hashedOtp,
            Name = preservedName,
            Phone = preservedPhone,
            Role = preservedRole,
            PasswordHash = preservedPasswordHash,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        await _otpRepository.SaveOtpAsync(newOtpVerification);

        var emailSent = await _otpService.SendOtpEmailAsync(email, otp);
        if (!emailSent)
        {
            _logger.LogWarning("Failed to resend OTP email to: {Email}", email);
            throw new SmartShipBadRequestException("Failed to send OTP. Please try again.");
        }

        return new OtpResponse
        {
            Success = true,
            Message = "OTP resent"
        };
    }

    public async Task<OtpResponse> VerifyOtpAsync(VerifyOtpRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("OTP verification request for email: {Email}", email);

        // Get OTP record (we do our own checks so we can increment attempts)
        var otpVerification = await _otpRepository.GetActiveOtpByEmailAsync(email);
        if (otpVerification == null)
        {
            _logger.LogWarning("No active OTP found for email: {Email}", email);
            throw new SmartShipUnauthorizedException("Invalid or expired OTP");
        }

        // Verify OTP
        if (!_otpService.VerifyOtp(request.Otp, otpVerification.OtpCode))
        {
            otpVerification.AttemptCount++;
            if (otpVerification.AttemptCount >= 3)
            {
                otpVerification.IsUsed = true;
                _logger.LogWarning("Max attempts exceeded for OTP verification: {Email}", email);
            }
            await _otpRepository.UpdateOtpAsync(otpVerification);

            var remaining = Math.Max(0, 3 - otpVerification.AttemptCount);
            throw new SmartShipUnauthorizedException($"Invalid OTP. Attempts remaining: {remaining}");
        }

        // Mark OTP as used
        otpVerification.IsUsed = true;
        await _otpRepository.UpdateOtpAsync(otpVerification);

        // Create user ONLY after successful OTP verification using stored signup data
        var existing = await _userRepository.GetUserByEmailAsync(email);
        if (existing != null)
        {
            _logger.LogWarning("User already exists during OTP verification: {Email}", email);
            throw new SmartShipBadRequestException("Email already in use");
        }

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = otpVerification.Email,
            Name = otpVerification.Name,
            Phone = otpVerification.Phone,
            PasswordHash = otpVerification.PasswordHash,
            // Public OTP signup must always result in CUSTOMER
            Role = "CUSTOMER",
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateUserAsync(user);
        _logger.LogInformation("User created via OTP verification: {UserId} with email: {Email}", user.UserId, user.Email);

        // Clean up OTP
        await _otpRepository.DeleteOtpAsync(otpVerification.OtpId);

        return new OtpResponse
        {
            Success = true,
            Message = "User registered successfully"
        };
    }

    public async Task<OtpResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Forgot password request for email: {Email}", email);

        // Check if user exists
        var user = await _userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            _logger.LogWarning("Forgot password requested for non-existent email: {Email}", email);
            throw new SmartShipNotFoundException("User not found with this email");
        }

        // Generate OTP
        var otp = _otpService.GenerateOtp();
        var hashedOtp = _otpService.HashOtp(otp);

        // Store password reset token with 5-minute expiry
        var resetToken = new PasswordResetToken
        {
            TokenId = Guid.NewGuid(),
            Email = email,
            OtpCode = hashedOtp,
            ExpiryTime = DateTime.UtcNow.AddMinutes(5),
            IsUsed = false,
            AttemptCount = 0,
            CreatedAt = DateTime.UtcNow
        };

        // Delete any existing password reset tokens for this email
        var existingToken = await _otpRepository.GetPasswordResetTokenByEmailAsync(email);
        if (existingToken != null)
        {
            await _otpRepository.DeletePasswordResetTokenAsync(existingToken.TokenId);
        }

        await _otpRepository.SavePasswordResetTokenAsync(resetToken);

        // Send OTP email
        var emailSent = await _otpService.SendPasswordResetEmailAsync(email, otp);
        if (!emailSent)
        {
            _logger.LogWarning("Failed to send password reset email to: {Email}", email);
            throw new SmartShipBadRequestException("Failed to send password reset email. Please try again.");
        }

        _logger.LogInformation("Password reset OTP sent to email: {Email}", email);

        return new OtpResponse
        {
            Success = true,
            Message = "Password reset OTP sent to your email. It will expire in 5 minutes."
        };
    }

    public async Task<OtpResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Password reset request for email: {Email}", email);

        // Get active password reset token
        var resetToken = await _otpRepository.GetActivePasswordResetTokenByEmailAsync(email);
        if (resetToken == null)
        {
            _logger.LogWarning("No active password reset token found for email: {Email}", email);
            throw new SmartShipUnauthorizedException("Invalid or expired password reset token");
        }

        // Verify OTP
        if (!_otpService.VerifyOtp(request.Otp, resetToken.OtpCode))
        {
            resetToken.AttemptCount++;
            if (resetToken.AttemptCount >= 3)
            {
                resetToken.IsUsed = true;
                _logger.LogWarning("Max attempts exceeded for password reset: {Email}", email);
            }
            await _otpRepository.UpdatePasswordResetTokenAsync(resetToken);

            throw new SmartShipUnauthorizedException($"Invalid OTP. Attempts remaining: {3 - resetToken.AttemptCount}");
        }

        // Mark token as used
        resetToken.IsUsed = true;
        await _otpRepository.UpdatePasswordResetTokenAsync(resetToken);

        // Get user and update password
        var user = await _userRepository.GetUserByEmailAsync(email);
        if (user == null)
        {
            _logger.LogWarning("User not found during password reset: {Email}", email);
            throw new SmartShipNotFoundException("User not found");
        }

        // Prevent reusing the current password
        if (VerifyPasswordHash(request.NewPassword, user.PasswordHash))
        {
            throw new SmartShipBadRequestException("New password must be different from the current password");
        }

        user.PasswordHash = CreatePasswordHash(request.NewPassword);
        await _userRepository.UpdateUserAsync(user);

        _logger.LogInformation("Password reset successfully for user: {UserId}", user.UserId);

        // Clean up reset token
        await _otpRepository.DeletePasswordResetTokenAsync(resetToken.TokenId);

        return new OtpResponse
        {
            Success = true,
            Message = "Password reset successfully"
        };
    }

    public async Task<OtpResponse> AdminCreateUserAsync(AdminCreateUserRequest request)
    {
        var email = NormalizeEmail(request.Email);
        _logger.LogInformation("Admin create user request for email: {Email}", email);

        var role = NormalizeRole(request.Role);
        if (role != "ADMIN" && role != "CUSTOMER")
        {
            throw new SmartShipBadRequestException("Invalid Role. Allowed values are ADMIN or CUSTOMER.");
        }

        var existing = await _userRepository.GetUserByEmailAsync(email);
        if (existing != null)
        {
            throw new SmartShipBadRequestException("Email already in use");
        }

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = email,
            Name = request.Name,
            Phone = request.Phone,
            PasswordHash = CreatePasswordHash(request.Password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateUserAsync(user);

        return new OtpResponse
        {
            Success = true,
            Message = "User created"
        };
    }

    public async Task<OtpResponse> UpdateUserRoleAsync(UpdateUserRoleRequest request)
    {
        _logger.LogInformation("Admin update role request for user: {UserId}", request.UserId);

        var role = NormalizeRole(request.Role);
        if (role != "ADMIN" && role != "CUSTOMER")
        {
            throw new SmartShipBadRequestException("Invalid Role. Allowed values are ADMIN or CUSTOMER.");
        }

        var user = await _userRepository.GetUserByIdAsync(request.UserId);
        if (user == null)
        {
            throw new SmartShipNotFoundException("User not found");
        }

        user.Role = role;
        await _userRepository.UpdateUserAsync(user);

        return new OtpResponse
        {
            Success = true,
            Message = "Role updated"
        };
    }

    private async Task<AuthResponse> GenerateAuthResponse(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtSettings.Secret);

        var audience = _jwtSettings.Audience;
        if (string.IsNullOrWhiteSpace(audience) && _jwtSettings.Audiences != null && _jwtSettings.Audiences.Count > 0)
        {
            audience = _jwtSettings.Audiences.FirstOrDefault(a => !string.IsNullOrWhiteSpace(a)) ?? string.Empty;
        }

        if (string.IsNullOrWhiteSpace(audience))
        {
            audience = !string.IsNullOrWhiteSpace(_jwtSettings.Aud1)
                ? _jwtSettings.Aud1
                : (!string.IsNullOrWhiteSpace(_jwtSettings.Aud2) ? _jwtSettings.Aud2 : string.Empty);
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role.ToUpper())
            }),
            Expires = DateTime.UtcNow.AddMinutes(_jwtSettings.ExpiryMinutes),
            Issuer = _jwtSettings.Issuer,
            Audience = audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var jwtToken = tokenHandler.WriteToken(token);

        var refreshToken = new RefreshToken
        {
            TokenId = Guid.NewGuid(),
            UserId = user.UserId,
            Token = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)),
            ExpiryDate = DateTime.UtcNow.AddDays(7)
        };
        await _userRepository.SaveRefreshTokenAsync(refreshToken);

        return new AuthResponse
        {
            Token = jwtToken,
            RefreshToken = refreshToken.Token,
            UserId = user.UserId,
            Name = user.Name,
            Role = user.Role
        };
    }

    private string CreatePasswordHash(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private bool VerifyPasswordHash(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }

    private static string NormalizeEmail(string email)
    {
        return (email ?? string.Empty).Trim().ToLowerInvariant();
    }

    private static string NormalizeRole(string role)
    {
        return (role ?? string.Empty).Trim().ToUpperInvariant();
    }
}
