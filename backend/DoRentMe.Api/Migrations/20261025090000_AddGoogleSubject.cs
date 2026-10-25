using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace DoRentMe.Api.Migrations;

[DbContext(typeof(DoRentMeDbContext))]
[Migration("20261025090000_AddGoogleSubject")]
public class AddGoogleSubject : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(name: "GoogleSubject", table: "Users", type: "varchar(255)", maxLength: 255, nullable: true);
        migrationBuilder.CreateIndex(name: "IX_Users_GoogleSubject", table: "Users", column: "GoogleSubject", unique: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Users_GoogleSubject", table: "Users");
        migrationBuilder.DropColumn(name: "GoogleSubject", table: "Users");
    }
}
