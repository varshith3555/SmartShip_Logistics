using SmartShip.IdentityService.Models;

namespace SmartShip.IdentityService.Repositories;

public interface IUserRepository
{
    Task<User?> GetUserByEmailAsync(string email);
    Task<User?> GetUserByIdAsync(Guid userId);
    Task<User> CreateUserAsync(User user);
    Task SaveRefreshTokenAsync(RefreshToken refreshToken);
    Task<RefreshToken?> GetRefreshTokenAsync(string token);
    Task UpdateRefreshTokenAsync(RefreshToken refreshToken);
    Task<IEnumerable<User>> GetAllUsersAsync();
    Task UpdateUserAsync(User user);
    Task DeleteUserAsync(Guid userId);
}
