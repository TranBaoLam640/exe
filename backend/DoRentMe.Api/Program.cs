using DoRentMe.Api.Common.Extensions;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Services;
var builder = WebApplication.CreateBuilder(args);
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<DoRentMeDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 0))));
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddApiControllers();
builder.Services.AddOpenApiDocumentation();
builder.Services.AddFrontendCors(builder.Configuration);

var app = builder.Build();

app.UseCentralizedExceptionHandling();
app.UseOpenApiDocumentation();
app.UseHttpsRedirection();
app.UseCors("Frontend");

app.MapControllers();

app.Run();
public partial class Program
{
}
