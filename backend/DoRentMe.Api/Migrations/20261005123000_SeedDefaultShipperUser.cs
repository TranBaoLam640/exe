using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    [DbContext(typeof(DoRentMeDbContext))]
    [Migration("20261005123000_SeedDefaultShipperUser")]
    public partial class SeedDefaultShipperUser : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "INSERT INTO `Roles` (`Id`, `Code`, `Name`, `Description`, `CreatedAt`) VALUES (4, 'SHIPPER', 'Shipper', 'User who handles order shipment and returns', '2026-01-01 00:00:00') ON DUPLICATE KEY UPDATE `Code` = VALUES(`Code`), `Name` = VALUES(`Name`), `Description` = VALUES(`Description`);");

            migrationBuilder.Sql(@"
INSERT INTO `Users` (`RoleId`, `Name`, `Email`, `Phone`, `PasswordHash`, `LoyaltyPoints`, `IsActive`, `CreatedAt`)
SELECT `Id`, 'Default Shipper', 'shipper@gmail.com', '0901234570', '$2a$11$MDIQviabfSA8BwEuyMc4F.9ugGvpV.4qT/OrPACj9TAHeUBRSAmlC', 0, TRUE, '2026-01-01 00:00:00'
FROM `Roles`
WHERE `Code` = 'SHIPPER'
  AND NOT EXISTS (SELECT 1 FROM `Users` WHERE `Email` = 'shipper@gmail.com');
");

            migrationBuilder.Sql(@"
UPDATE `Users` AS user
JOIN `Roles` AS role ON role.`Code` = 'SHIPPER'
SET user.`RoleId` = role.`Id`,
    user.`IsActive` = TRUE,
    user.`Name` = COALESCE(NULLIF(user.`Name`, ''), 'Default Shipper'),
    user.`Phone` = COALESCE(user.`Phone`, '0901234570'),
    user.`UpdatedAt` = UTC_TIMESTAMP()
WHERE user.`Email` = 'shipper@gmail.com';
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM `Users` WHERE `Email` = 'shipper@gmail.com' AND `Name` = 'Default Shipper';");
        }
    }
}
