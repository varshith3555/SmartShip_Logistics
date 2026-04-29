using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SmartShip.IdentityService.Migrations
{
    /// <inheritdoc />
    public partial class AddOtpPendingSignupData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "OtpVerifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PasswordHash",
                table: "OtpVerifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "OtpVerifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Role",
                table: "OtpVerifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "OtpVerifications");

            migrationBuilder.DropColumn(
                name: "PasswordHash",
                table: "OtpVerifications");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "OtpVerifications");

            migrationBuilder.DropColumn(
                name: "Role",
                table: "OtpVerifications");
        }
    }
}
