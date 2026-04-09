using SmartShip.IdentityService.DTOs;

namespace SmartShip.IdentityService.Services;

public interface IUserService
{
    Task<UserDto> GetProfileAsync(Guid userId);
    Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    
    Task<IEnumerable<UserDto>> GetAllUsersAsync();
    Task<UserDto> GetUserByIdAsync(Guid userId);
    Task<UserDto> CreateUserAsync(CreateUserRequest request);
    Task UpdateUserAsync(Guid userId, UpdateUserRequest request);
    Task DeleteUserAsync(Guid userId);
    
    Task AssignRoleAsync(Guid userId, AssignRoleRequest request);
    Task<IEnumerable<RoleDto>> GetRolesAsync();
}
