using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddShipperRole : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "INSERT INTO `Roles` (`Id`, `Code`, `Name`, `Description`, `CreatedAt`) VALUES (4, 'SHIPPER', 'Shipper', 'User who handles order shipment and returns', '2026-01-01 00:00:00') ON DUPLICATE KEY UPDATE `Code` = VALUES(`Code`), `Name` = VALUES(`Name`), `Description` = VALUES(`Description`);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM `Roles` WHERE `Code` = 'SHIPPER';");
        }
    }
}
