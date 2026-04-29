using Microsoft.EntityFrameworkCore;
using SmartShip.ShipmentService.Models;

namespace SmartShip.ShipmentService.Data;

public class ShipmentDbContext : DbContext
{
    public ShipmentDbContext(DbContextOptions<ShipmentDbContext> options) : base(options) { }

    public DbSet<Shipment> Shipments { get; set; }
    public DbSet<ShipmentItem> ShipmentItems { get; set; }
    public DbSet<Address> Addresses { get; set; }
    public DbSet<PickupDetails> PickupDetails { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Explicit Primary Keys (IMPORTANT FIX)
        modelBuilder.Entity<Shipment>().HasKey(s => s.ShipmentId);
        modelBuilder.Entity<ShipmentItem>().HasKey(i => i.ItemId);
        modelBuilder.Entity<Address>().HasKey(a => a.AddressId);
        modelBuilder.Entity<PickupDetails>().HasKey(p => p.PickupId);   // FIX

        // Unique tracking number
        modelBuilder.Entity<Shipment>()
            .HasIndex(s => s.TrackingNumber)
            .IsUnique();

        // Decimal precision (prevents silent truncation)
        modelBuilder.Entity<Shipment>()
            .Property(x => x.Price)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Shipment>()
            .Property(x => x.TotalWeight)
            .HasPrecision(18, 2);

        modelBuilder.Entity<ShipmentItem>()
            .Property(x => x.Weight)
            .HasPrecision(18, 2);

        // Sender Address
        modelBuilder.Entity<Shipment>()
            .HasOne(s => s.SenderAddress)
            .WithMany()
            .HasForeignKey(s => s.SenderAddressId)
            .OnDelete(DeleteBehavior.Restrict);

        // Receiver Address
        modelBuilder.Entity<Shipment>()
            .HasOne(s => s.ReceiverAddress)
            .WithMany()
            .HasForeignKey(s => s.ReceiverAddressId)
            .OnDelete(DeleteBehavior.Restrict);

        // Shipment Items (1-M)
        modelBuilder.Entity<Shipment>()
            .HasMany(s => s.Items)
            .WithOne(i => i.Shipment)
            .HasForeignKey(i => i.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);

        // PickupDetails (1-1)
        modelBuilder.Entity<Shipment>()
            .HasOne(s => s.PickupDetails)
            .WithOne(p => p.Shipment)
            .HasForeignKey<PickupDetails>(p => p.ShipmentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}