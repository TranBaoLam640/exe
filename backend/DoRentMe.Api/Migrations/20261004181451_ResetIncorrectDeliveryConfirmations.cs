using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoRentMe.Api.Migrations
{
    /// <inheritdoc />
    public partial class ResetIncorrectDeliveryConfirmations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                "UPDATE `Orders` SET `DeliveryConfirmed` = FALSE WHERE `Status` = 'delivered' AND `DeliveryConfirmed` = TRUE;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
