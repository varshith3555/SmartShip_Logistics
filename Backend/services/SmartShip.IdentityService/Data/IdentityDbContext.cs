using Microsoft.EntityFrameworkCore;
using SmartShip.IdentityService.Models;

namespace SmartShip.IdentityService.Data;

public class IdentityDbContext : DbContext
{
    public IdentityDbContext(DbContextOptions<IdentityDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<RefreshToken> RefreshTokens { get; set; }
    public DbSet<OtpVerification> OtpVerifications { get; set; }
    public DbSet<PasswordResetToken> PasswordResetTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User Entity
        modelBuilder.Entity<User>()
            .HasKey(u => u.UserId);

        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();

        // RefreshToken Entity
        modelBuilder.Entity<RefreshToken>()
            .HasKey(rt => rt.TokenId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.RefreshTokens)
            .WithOne(rt => rt.User)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // OtpVerification Entity
        modelBuilder.Entity<OtpVerification>()
            .HasKey(o => o.OtpId);

        modelBuilder.Entity<OtpVerification>()
            .HasIndex(o => o.Email);

        // PasswordResetToken Entity
        modelBuilder.Entity<PasswordResetToken>()
            .HasKey(p => p.TokenId);

        modelBuilder.Entity<PasswordResetToken>()
            .HasIndex(p => p.Email);
    }
}
