using DoRentMe.Api.Common.Extensions;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

builder.Services.AddDbContext<DoRentMeDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 0))));
// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException(
        "JWT SecretKey not configured"
    );

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtSettings["Issuer"],
                ValidAudience = jwtSettings["Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(secretKey)
                    ),

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();
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
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
public partial class Program
{
}
