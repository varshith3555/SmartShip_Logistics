using System.ComponentModel.DataAnnotations;

namespace SmartShip.IdentityService.DTOs;

public class UserDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class UpdateProfileRequest
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required]
    public string OldPassword { get; set; } = string.Empty;
    
    [Required]
    public string NewPassword { get; set; } = string.Empty;
}

public class CreateUserRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    [Required, MinLength(6)]
    public string Password { get; set; } = string.Empty;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Phone { get; set; } = string.Empty;
    
    [Required]
    public string Role { get; set; } = "CUSTOMER";
}

public class UpdateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
}

public class RoleDto
{
    public string RoleName { get; set; } = string.Empty;
}

public class AssignRoleRequest
{
    [Required]
    public string Role { get; set; } = string.Empty;
}
