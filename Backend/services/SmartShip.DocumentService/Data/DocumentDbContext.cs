using Microsoft.EntityFrameworkCore;
using SmartShip.DocumentService.Models;

namespace SmartShip.DocumentService.Data;

public class DocumentDbContext : DbContext
{
    public DocumentDbContext(DbContextOptions<DocumentDbContext> options) : base(options) { }

    public DbSet<Document> Documents { get; set; }
    public DbSet<DeliveryProof> DeliveryProofs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // PRIMARY KEYS (IMPORTANT)
        modelBuilder.Entity<Document>().HasKey(d => d.DocumentId);
        modelBuilder.Entity<DeliveryProof>().HasKey(p => p.ProofId);

        // Indexes
        modelBuilder.Entity<Document>()
            .HasIndex(d => d.ShipmentId);

        modelBuilder.Entity<DeliveryProof>()
            .HasIndex(p => p.ShipmentId)
            .IsUnique();
    }
}
