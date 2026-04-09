using SmartShip.IdentityService.DTOs;
using SmartShip.IdentityService.Models;
using SmartShip.IdentityService.Repositories;
using System.Security.Claims;
using SmartShip.Core.Exceptions;

namespace SmartShip.IdentityService.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<UserDto> GetProfileAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");
        return MapToDto(user);
    }

    public async Task UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");

        user.Name = request.Name ?? user.Name;
        user.Phone = request.Phone ?? user.Phone;

        await _userRepository.UpdateUserAsync(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");

        if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
            throw new SmartShipUnauthorizedException("Invalid old password");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _userRepository.UpdateUserAsync(user);
    }

    public async Task<IEnumerable<UserDto>> GetAllUsersAsync()
    {
        var users = await _userRepository.GetAllUsersAsync();
        return users.Select(MapToDto);
    }

    public async Task<UserDto> GetUserByIdAsync(Guid userId)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");
        return MapToDto(user);
    }

    public async Task<UserDto> CreateUserAsync(CreateUserRequest request)
    {
        var existing = await _userRepository.GetUserByEmailAsync(request.Email);
        if (existing != null) throw new SmartShipBadRequestException("Email already in use");

        string role = "CUSTOMER";
        if (request.Role?.ToUpperInvariant() == "ADMIN") role = "ADMIN";

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            Phone = request.Phone,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        await _userRepository.CreateUserAsync(user);
        return MapToDto(user);
    }

    public async Task UpdateUserAsync(Guid userId, UpdateUserRequest request)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");

        user.Name = request.Name ?? user.Name;
        user.Phone = request.Phone ?? user.Phone;
        
        if (!string.IsNullOrWhiteSpace(request.Role))
        {
            string role = request.Role.ToUpperInvariant();
            if (role == "ADMIN" || role == "CUSTOMER")
            {
                user.Role = role;
            }
        }

        await _userRepository.UpdateUserAsync(user);
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        await _userRepository.DeleteUserAsync(userId);
    }

    public async Task AssignRoleAsync(Guid userId, AssignRoleRequest request)
    {
        var user = await _userRepository.GetUserByIdAsync(userId);
        if (user == null) throw new SmartShipNotFoundException("User not found");

        string role = request.Role?.ToUpperInvariant() ?? "CUSTOMER";
        if (role != "ADMIN" && role != "CUSTOMER")
            throw new SmartShipBadRequestException("Invalid role");

        user.Role = role;
        await _userRepository.UpdateUserAsync(user);
    }

    public Task<IEnumerable<RoleDto>> GetRolesAsync()
    {
        var roles = new List<RoleDto>
        {
            new RoleDto { RoleName = "ADMIN" },
            new RoleDto { RoleName = "CUSTOMER" }
        };
        return Task.FromResult<IEnumerable<RoleDto>>(roles);
    }

    private static UserDto MapToDto(User user)
    {
        return new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
