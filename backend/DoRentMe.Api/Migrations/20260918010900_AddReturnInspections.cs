using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddReturnInspections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ReturnInspections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    OrderId = table.Column<int>(type: "int", nullable: false),
                    OrderItemId = table.Column<int>(type: "int", nullable: false),
                    ProductInventoryItemId = table.Column<int>(type: "int", nullable: false),
                    ConditionAfterReturn = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HasDamage = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    DamageDescription = table.Column<string>(type: "varchar(1000)", maxLength: 1000, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RecommendedDeduction = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    InspectorUserId = table.Column<int>(type: "int", nullable: false),
                    InspectedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ReturnInspections", x => x.Id);
                    table.CheckConstraint("CK_ReturnInspections_Condition", "`ConditionAfterReturn` IN ('NEW','GOOD','FAIR','WORN','DAMAGED')");
                    table.CheckConstraint("CK_ReturnInspections_RecommendedDeduction", "`RecommendedDeduction` >= 0");
                    table.ForeignKey(
                        name: "FK_ReturnInspections_OrderItems_OrderItemId",
                        column: x => x.OrderItemId,
                        principalTable: "OrderItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnInspections_Orders_OrderId",
                        column: x => x.OrderId,
                        principalTable: "Orders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnInspections_ProductInventoryItems_ProductInventoryItem~",
                        column: x => x.ProductInventoryItemId,
                        principalTable: "ProductInventoryItems",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ReturnInspections_Users_InspectorUserId",
                        column: x => x.InspectorUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnInspections_InspectorUserId",
                table: "ReturnInspections",
                column: "InspectorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnInspections_OrderId_ProductInventoryItemId",
                table: "ReturnInspections",
                columns: new[] { "OrderId", "ProductInventoryItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ReturnInspections_OrderItemId",
                table: "ReturnInspections",
                column: "OrderItemId");

            migrationBuilder.CreateIndex(
                name: "IX_ReturnInspections_ProductInventoryItemId",
                table: "ReturnInspections",
                column: "ProductInventoryItemId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ReturnInspections");
        }
    }
}
