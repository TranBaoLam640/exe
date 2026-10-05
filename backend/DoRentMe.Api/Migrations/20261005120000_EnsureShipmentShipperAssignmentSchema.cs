using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    [DbContext(typeof(DoRentMeDbContext))]
    [Migration("20261005120000_EnsureShipmentShipperAssignmentSchema")]
    public partial class EnsureShipmentShipperAssignmentSchema : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "INSERT INTO `Roles` (`Id`, `Code`, `Name`, `Description`, `CreatedAt`) VALUES (4, 'SHIPPER', 'Shipper', 'User who handles order shipment and returns', '2026-01-01 00:00:00') ON DUPLICATE KEY UPDATE `Code` = VALUES(`Code`), `Name` = VALUES(`Name`), `Description` = VALUES(`Description`);");

            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @add_column_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND COLUMN_NAME = 'AssignedShipperUserId') = 0,
    'ALTER TABLE `Shipments` ADD COLUMN `AssignedShipperUserId` int NULL',
    'SELECT 1');
PREPARE add_column_stmt FROM @add_column_sql;
EXECUTE add_column_stmt;
DEALLOCATE PREPARE add_column_stmt;
");

            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @add_index_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND INDEX_NAME = 'IX_Shipments_AssignedShipperUserId') = 0,
    'CREATE INDEX `IX_Shipments_AssignedShipperUserId` ON `Shipments` (`AssignedShipperUserId`)',
    'SELECT 1');
PREPARE add_index_stmt FROM @add_index_sql;
EXECUTE add_index_stmt;
DEALLOCATE PREPARE add_index_stmt;
");

            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @add_fk_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND CONSTRAINT_NAME = 'FK_Shipments_Users_AssignedShipperUserId'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0,
    'ALTER TABLE `Shipments` ADD CONSTRAINT `FK_Shipments_Users_AssignedShipperUserId` FOREIGN KEY (`AssignedShipperUserId`) REFERENCES `Users` (`Id`) ON DELETE RESTRICT',
    'SELECT 1');
PREPARE add_fk_stmt FROM @add_fk_sql;
EXECUTE add_fk_stmt;
DEALLOCATE PREPARE add_fk_stmt;
");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @drop_fk_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND CONSTRAINT_NAME = 'FK_Shipments_Users_AssignedShipperUserId'
       AND CONSTRAINT_TYPE = 'FOREIGN KEY') > 0,
    'ALTER TABLE `Shipments` DROP FOREIGN KEY `FK_Shipments_Users_AssignedShipperUserId`',
    'SELECT 1');
PREPARE drop_fk_stmt FROM @drop_fk_sql;
EXECUTE drop_fk_stmt;
DEALLOCATE PREPARE drop_fk_stmt;
");

            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @drop_index_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND INDEX_NAME = 'IX_Shipments_AssignedShipperUserId') > 0,
    'DROP INDEX `IX_Shipments_AssignedShipperUserId` ON `Shipments`',
    'SELECT 1');
PREPARE drop_index_stmt FROM @drop_index_sql;
EXECUTE drop_index_stmt;
DEALLOCATE PREPARE drop_index_stmt;
");

            migrationBuilder.Sql(@"
SET @schema_name = DATABASE();
SET @drop_column_sql = IF(
    (SELECT COUNT(*)
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @schema_name
       AND TABLE_NAME = 'Shipments'
       AND COLUMN_NAME = 'AssignedShipperUserId') > 0,
    'ALTER TABLE `Shipments` DROP COLUMN `AssignedShipperUserId`',
    'SELECT 1');
PREPARE drop_column_stmt FROM @drop_column_sql;
EXECUTE drop_column_stmt;
DEALLOCATE PREPARE drop_column_stmt;
");
        }
    }
}
