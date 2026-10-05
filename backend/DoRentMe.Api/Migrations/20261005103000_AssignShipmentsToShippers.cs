using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    [DbContext(typeof(DoRentMeDbContext))]
    [Migration("20261005103000_AssignShipmentsToShippers")]
    public partial class AssignShipmentsToShippers : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedShipperUserId",
                table: "Shipments",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Shipments_AssignedShipperUserId",
                table: "Shipments",
                column: "AssignedShipperUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shipments_Users_AssignedShipperUserId",
                table: "Shipments",
                column: "AssignedShipperUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shipments_Users_AssignedShipperUserId",
                table: "Shipments");

            migrationBuilder.DropIndex(
                name: "IX_Shipments_AssignedShipperUserId",
                table: "Shipments");

            migrationBuilder.DropColumn(
                name: "AssignedShipperUserId",
                table: "Shipments");
        }
    }
}
