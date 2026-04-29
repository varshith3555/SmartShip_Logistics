using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SmartShip.IdentityService.DTOs;
using SmartShip.IdentityService.Services;

namespace SmartShip.IdentityService.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _configuration;
    private readonly IAuthenticationSchemeProvider _schemeProvider;

    public AuthController(IAuthService authService, IConfiguration configuration, IAuthenticationSchemeProvider schemeProvider)
    {
        _authService = authService;
        _configuration = configuration;
        _schemeProvider = schemeProvider;
    }

    /// <summary> 
    /// User login with email and password
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>JWT Token and Refresh Token</returns>
    [HttpPost("login")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.LoginAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Signup request (OTP) - does NOT create user
    /// </summary>
    /// <param name="request">Signup details</param>
    /// <returns>OTP sent message</returns>
    [HttpPost("signup")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Signup([FromBody] SignupWithOtpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.SignupWithOtpAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Direct signup (legacy) - creates user immediately.
    /// Kept to avoid removing working code; prefer OTP signup via /signup.
    /// </summary>
    // WARNING: This endpoint bypasses OTP and is not recommended for production.
    [ApiExplorerSettings(IgnoreApi = true)]
    [System.Obsolete("Use /api/auth/signup with OTP instead")]
    [HttpPost("signup-direct")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SignupDirect([FromBody] SignupRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.SignupAsync(request);
        return CreatedAtAction(nameof(Login), response);
    }

    /// <summary>
    /// Resend OTP for an existing signup OTP request
    /// </summary>
    [HttpPost("resend-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.ResendOtpAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Step 2: Verify OTP and create user account
    /// </summary>
    /// <param name="request">Email, OTP, and password</param>
    /// <returns>JWT Token if OTP is valid</returns>
    [HttpPost("verify-otp")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.VerifyOtpAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Refresh JWT token using refresh token
    /// </summary>
    /// <param name="request">Refresh token payload</param>
    /// <returns>New JWT Token</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var refreshToken = request?.RefreshToken;
        if (string.IsNullOrWhiteSpace(refreshToken))
            return BadRequest("Refresh token is required");

        var response = await _authService.RefreshTokenAsync(refreshToken);
        return Ok(response);
    }

    /// <summary>
    /// Request password reset OTP
    /// </summary>
    /// <param name="request">Email address</param>
    /// <returns>OTP sent to email</returns>
    [HttpPost("forgot-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.ForgotPasswordAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Reset password with OTP
    /// </summary>
    /// <param name="request">Email, OTP, and new password</param>
    /// <returns>Success message</returns>
    [HttpPost("reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.ResetPasswordAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Admin-only: Create a user with an explicit role (ADMIN or CUSTOMER)
    /// </summary>
    [Authorize(Roles = "ADMIN")]
    [HttpPost("/api/admin/create-user")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> AdminCreateUser([FromBody] AdminCreateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.AdminCreateUserAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Admin-only: Update role of an existing user (ADMIN or CUSTOMER)
    /// </summary>
    [Authorize(Roles = "ADMIN")]
    [HttpPut("/api/admin/update-role")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateUserRole([FromBody] UpdateUserRoleRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var response = await _authService.UpdateUserRoleAsync(request);
        return Ok(response);
    }

    /// <summary>
    /// Start Google OAuth login flow.
    /// This is additive and does not affect password/JWT endpoints.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("google/login")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    public IActionResult GoogleLogin([FromQuery] string? returnUrl = null)
    {
        var clientId = _configuration["GoogleOAuth:ClientId"];
        var clientSecret = _configuration["GoogleOAuth:ClientSecret"];
        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
        {
            return BadRequest("Google OAuth is not configured. Set GoogleOAuth:ClientId and GoogleOAuth:ClientSecret.");
        }

        // If credentials were added after the service started, config reload can pass the check above,
        // but the scheme still won't exist until the service restarts.
        var googleScheme = _schemeProvider.GetSchemeAsync("Google").GetAwaiter().GetResult();
        if (googleScheme == null)
        {
            return BadRequest("Google OAuth is configured but not loaded. Restart SmartShip.IdentityService so the Google auth scheme is registered.");
        }

        // After Google callback is processed, redirect back through gateway to our completion endpoint.
        // Keeping this as an upstream path avoids redirecting to a non-routable downstream URL.
        var props = new AuthenticationProperties
        {
            RedirectUri = "/gateway/auth/google/complete"
        };

        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            props.Items["returnUrl"] = returnUrl;
        }

        return Challenge(props, "Google");
    }

    /// <summary>
    /// OAuth completion endpoint: reads the external principal, creates/loads a user,
    /// issues SmartShip JWT/refresh tokens, then redirects to the frontend callback route.
    /// </summary>
    [AllowAnonymous]
    [HttpGet("google/complete")]
    [ProducesResponseType(StatusCodes.Status302Found)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleComplete()
    {
        var result = await HttpContext.AuthenticateAsync("External");
        if (!result.Succeeded || result.Principal == null)
        {
            return Unauthorized("Google authentication failed");
        }

        var email = result.Principal.FindFirstValue(ClaimTypes.Email)
                    ?? result.Principal.FindFirstValue("email");
        if (string.IsNullOrWhiteSpace(email))
        {
            await HttpContext.SignOutAsync("External");
            return BadRequest("Google account did not provide an email address");
        }

        var name = result.Principal.FindFirstValue(ClaimTypes.Name)
                   ?? result.Principal.Identity?.Name
                   ?? string.Empty;

        var auth = await _authService.ExternalLoginAsync(email, name);
        await HttpContext.SignOutAsync("External");

        var frontendRedirect = _configuration["GoogleOAuth:FrontendRedirectUrl"];
        if (string.IsNullOrWhiteSpace(frontendRedirect))
        {
            frontendRedirect = "http://localhost:4200/auth/oauth-callback";
        }

        string? returnUrl = null;
        if (result.Properties?.Items != null && result.Properties.Items.TryGetValue("returnUrl", out var ru))
        {
            returnUrl = ru;
        }

        var redirectUrl = BuildFrontendRedirect(frontendRedirect, auth, returnUrl);
        return Redirect(redirectUrl);
    }

    private static string BuildFrontendRedirect(string baseUrl, AuthResponse auth, string? returnUrl)
    {
        var trimmed = (baseUrl ?? string.Empty).Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            trimmed = "http://localhost:4200/auth/oauth-callback";
        }

        var parts = new List<string>
        {
            $"token={Uri.EscapeDataString(auth.Token)}",
            $"refreshToken={Uri.EscapeDataString(auth.RefreshToken)}"
        };

        if (!string.IsNullOrWhiteSpace(returnUrl))
        {
            parts.Add($"returnUrl={Uri.EscapeDataString(returnUrl)}");
        }

        return $"{trimmed}#{string.Join("&", parts)}";
    }
}
