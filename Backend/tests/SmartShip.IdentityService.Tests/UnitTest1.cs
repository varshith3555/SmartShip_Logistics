using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using SmartShip.Core.Authentication;
using SmartShip.IdentityService.DTOs;
using SmartShip.IdentityService.Models;
using SmartShip.IdentityService.Repositories;
using SmartShip.IdentityService.Services;

namespace SmartShip.IdentityService.Tests;

public class AuthServiceTests
{
    private static IOptions<JwtSettings> JwtOptions() =>
        Options.Create(new JwtSettings
        {
            Secret = "THIS_IS_A_TEST_SECRET_THAT_IS_LONG_ENOUGH_1234567890",
            Issuer = "smartship-tests",
            Audience = "smartship-tests",
            ExpiryMinutes = 60
        });

    [Test]
    public async Task SignupAsync_IgnoresRequestedRole_AndAlwaysCreatesCustomer()
    {
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var otpRepo = new Mock<IOtpRepository>(MockBehavior.Strict);
        var otpService = new Mock<IOtpService>(MockBehavior.Strict);
        var logger = new Mock<ILogger<AuthService>>();

        userRepo.Setup(r => r.GetUserByEmailAsync("test@example.com")).ReturnsAsync((User?)null);

        User? created = null;
        userRepo.Setup(r => r.CreateUserAsync(It.IsAny<User>()))
            .Callback<User>(u => created = u)
            .ReturnsAsync((User u) => u);

        userRepo.Setup(r => r.SaveRefreshTokenAsync(It.IsAny<RefreshToken>())).Returns(Task.CompletedTask);

        var sut = new AuthService(userRepo.Object, otpRepo.Object, otpService.Object, JwtOptions(), logger.Object);

        var response = await sut.SignupAsync(new SignupRequest
        {
            Name = "Test",
            Email = "TEST@EXAMPLE.COM",
            Phone = "1234567890",
            Password = "Passw0rd!",
            Role = "ADMIN"
        });

        Assert.That(created, Is.Not.Null);
        Assert.That(created!.Role, Is.EqualTo("CUSTOMER"));
        Assert.That(created.Email, Is.EqualTo("test@example.com"));
        Assert.That(response.Role, Is.EqualTo("CUSTOMER"));
        Assert.That(response.Token, Is.Not.Empty);
        Assert.That(response.RefreshToken, Is.Not.Empty);

        userRepo.VerifyAll();
    }

    [Test]
    public async Task ExternalLoginAsync_WhenNewUser_CreatesCustomerAndUsesProvidedName()
    {
        var userRepo = new Mock<IUserRepository>(MockBehavior.Strict);
        var otpRepo = new Mock<IOtpRepository>(MockBehavior.Strict);
        var otpService = new Mock<IOtpService>(MockBehavior.Strict);
        var logger = new Mock<ILogger<AuthService>>();

        userRepo.Setup(r => r.GetUserByEmailAsync("user@example.com")).ReturnsAsync((User?)null);

        User? created = null;
        userRepo.Setup(r => r.CreateUserAsync(It.IsAny<User>()))
            .Callback<User>(u => created = u)
            .ReturnsAsync((User u) => u);

        userRepo.Setup(r => r.SaveRefreshTokenAsync(It.IsAny<RefreshToken>())).Returns(Task.CompletedTask);

        var sut = new AuthService(userRepo.Object, otpRepo.Object, otpService.Object, JwtOptions(), logger.Object);

        var response = await sut.ExternalLoginAsync("USER@EXAMPLE.COM", "  John  ");

        Assert.That(created, Is.Not.Null);
        Assert.That(created!.Role, Is.EqualTo("CUSTOMER"));
        Assert.That(created.Email, Is.EqualTo("user@example.com"));
        Assert.That(created.Name, Is.EqualTo("John"));
        Assert.That(response.Role, Is.EqualTo("CUSTOMER"));

        userRepo.VerifyAll();
    }
}
