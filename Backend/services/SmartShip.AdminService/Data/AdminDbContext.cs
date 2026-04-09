using Microsoft.EntityFrameworkCore;
using SmartShip.AdminService.Models;

namespace SmartShip.AdminService.Data;

public class AdminDbContext : DbContext
{
    public AdminDbContext(DbContextOptions<AdminDbContext> options) : base(options) { }

    public DbSet<Hub> Hubs { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<ShipmentException> ShipmentExceptions { get; set; }
    public DbSet<Report> Reports { get; set; }
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PRIMARY KEYS (IMPORTANT)
        modelBuilder.Entity<Location>().HasKey(l => l.LocationId);
        modelBuilder.Entity<Hub>().HasKey(h => h.HubId);
        modelBuilder.Entity<ShipmentException>().HasKey(e => e.ExceptionId); 
        modelBuilder.Entity<Report>().HasKey(r => r.ReportId);

        // RELATIONSHIP
        modelBuilder.Entity<Hub>()
            .HasOne(h => h.Location)
            .WithMany()
            .HasForeignKey(h => h.LocationId);
    }
}
