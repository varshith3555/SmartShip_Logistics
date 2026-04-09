using SmartShip.IdentityService.DTOs;

namespace SmartShip.IdentityService.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> SignupAsync(SignupRequest request);
    Task<AuthResponse> ExternalLoginAsync(string email, string name);
    Task<AuthResponse> RefreshTokenAsync(string token);
    Task<OtpResponse> SignupWithOtpAsync(SignupWithOtpRequest request);
    Task<OtpResponse> ResendOtpAsync(ResendOtpRequest request);
    Task<OtpResponse> VerifyOtpAsync(VerifyOtpRequest request);
    Task<OtpResponse> ForgotPasswordAsync(ForgotPasswordRequest request);
    Task<OtpResponse> ResetPasswordAsync(ResetPasswordRequest request);

    Task<OtpResponse> AdminCreateUserAsync(AdminCreateUserRequest request);
    Task<OtpResponse> UpdateUserRoleAsync(UpdateUserRoleRequest request);
}
