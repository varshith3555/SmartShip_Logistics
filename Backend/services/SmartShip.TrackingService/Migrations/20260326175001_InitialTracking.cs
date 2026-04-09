using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartShip.TrackingService.Migrations
{
    /// <inheritdoc />
    public partial class InitialTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ShipmentStatuses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TrackingNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    CurrentStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ShipmentStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrackingHistories",
                columns: table => new
                {
                    TrackingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ShipmentId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    TrackingNumber = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Location = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Remarks = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrackingHistories", x => x.TrackingId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ShipmentStatuses_TrackingNumber",
                table: "ShipmentStatuses",
                column: "TrackingNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TrackingHistories_TrackingNumber",
                table: "TrackingHistories",
                column: "TrackingNumber");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ShipmentStatuses");

            migrationBuilder.DropTable(
                name: "TrackingHistories");
        }
    }
}
