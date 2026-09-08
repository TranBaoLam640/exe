using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class ChangeShopSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "OwnerUserId",
                table: "Shops",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Shops_OwnerUserId",
                table: "Shops",
                column: "OwnerUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Shops_Users_OwnerUserId",
                table: "Shops",
                column: "OwnerUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Shops_Users_OwnerUserId",
                table: "Shops");

            migrationBuilder.DropIndex(
                name: "IX_Shops_OwnerUserId",
                table: "Shops");

            migrationBuilder.DropColumn(
                name: "OwnerUserId",
                table: "Shops");
        }
    }
}
