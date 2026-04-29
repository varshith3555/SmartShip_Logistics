using Microsoft.EntityFrameworkCore;
using SmartShip.TrackingService.Models;

namespace SmartShip.TrackingService.Data;

public class TrackingDbContext : DbContext
{
    public TrackingDbContext(DbContextOptions<TrackingDbContext> options) : base(options) { }

    public DbSet<ShipmentStatus> ShipmentStatuses { get; set; }
    public DbSet<TrackingHistory> TrackingHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PRIMARY KEYS
        modelBuilder.Entity<ShipmentStatus>().HasKey(s => s.Id);
        modelBuilder.Entity<TrackingHistory>().HasKey(t => t.TrackingId);  // FIX

        // Indexes
        modelBuilder.Entity<ShipmentStatus>()
            .HasIndex(s => s.TrackingNumber)
            .IsUnique();

        modelBuilder.Entity<TrackingHistory>()
            .HasIndex(t => t.TrackingNumber);
    }
}
