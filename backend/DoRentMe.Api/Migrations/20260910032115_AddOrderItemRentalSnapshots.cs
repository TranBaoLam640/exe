using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddOrderItemRentalSnapshots : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DepositSubtotal",
                table: "OrderItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LineSubtotal",
                table: "OrderItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "RentalDays",
                table: "OrderItems",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RentalEndDate",
                table: "OrderItems",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(2026, 1, 2));

            migrationBuilder.AddColumn<DateOnly>(
                name: "RentalStartDate",
                table: "OrderItems",
                type: "date",
                nullable: false,
                defaultValue: new DateOnly(2026, 1, 1));

            migrationBuilder.CreateIndex(
                name: "IX_OrderItems_ProductVariantId_RentalStartDate_RentalEndDate",
                table: "OrderItems",
                columns: new[] { "ProductVariantId", "RentalStartDate", "RentalEndDate" });

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderItems_DateRange",
                table: "OrderItems",
                sql: "`RentalEndDate` > `RentalStartDate`");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderItems_DepositSubtotal",
                table: "OrderItems",
                sql: "`DepositSubtotal` >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderItems_LineSubtotal",
                table: "OrderItems",
                sql: "`LineSubtotal` >= 0");

            migrationBuilder.AddCheckConstraint(
                name: "CK_OrderItems_RentalDays",
                table: "OrderItems",
                sql: "`RentalDays` > 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_OrderItems_ProductVariantId_RentalStartDate_RentalEndDate",
                table: "OrderItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderItems_DateRange",
                table: "OrderItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderItems_DepositSubtotal",
                table: "OrderItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderItems_LineSubtotal",
                table: "OrderItems");

            migrationBuilder.DropCheckConstraint(
                name: "CK_OrderItems_RentalDays",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "DepositSubtotal",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "LineSubtotal",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "RentalDays",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "RentalEndDate",
                table: "OrderItems");

            migrationBuilder.DropColumn(
                name: "RentalStartDate",
                table: "OrderItems");
        }
    }
}
