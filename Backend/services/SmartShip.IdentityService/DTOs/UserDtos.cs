using System.ComponentModel.DataAnnotations;

namespace SmartShip.IdentityService.DTOs;

/// <summary>
/// User projection returned by user/profile endpoints.
/// </summary>
public class UserDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Request payload for updating the authenticated user's profile.
/// </summary>
public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    [RegularExpression(@"^(\d{10})?$", ErrorMessage = "Phone must be 10 digits")]
    public string Phone { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for changing the authenticated user's password.
/// </summary>
public class ChangePasswordRequest
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;
    
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

/// <summary>
/// Admin request payload for creating a new user.
/// </summary>
public class CreateUserRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;

    [RegularExpression(@"^(\d{10})?$", ErrorMessage = "Phone must be 10 digits")]
    public string Phone { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = "CUSTOMER";
}

/// <summary>
/// Admin request payload for updating a user.
/// </summary>
public class UpdateUserRequest
{
    public string Name { get; set; } = string.Empty;
    [RegularExpression(@"^(\d{10})?$", ErrorMessage = "Phone must be 10 digits")]
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

/// <summary>
/// Role DTO.
/// </summary>
public class RoleDto
{
    public string RoleName { get; set; } = string.Empty;
}

/// <summary>
/// Request payload for assigning a role to a user.
/// </summary>
public class AssignRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}
