using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoRentMe.Api.Tests.Admin;

public class AdminAuthorizationTests : IDisposable
{
    private const string Password = "Password123!";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AdminAuthorizationTests()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task AdminSession_RequiresAdminRole()
    {
        await EnsureUserAsync("admin-guard@example.com", "ADMIN");
        await EnsureUserAsync("customer-guard@example.com", "CUSTOMER");
        await EnsureUserAsync("lender-guard@example.com", "LENDER");

        _client.DefaultRequestHeaders.Authorization = null;
        var unauthenticated = await _client.GetAsync("/api/admin/session");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        await LoginAsync("customer-guard@example.com");
        var customer = await _client.GetAsync("/api/admin/session");
        Assert.Equal(HttpStatusCode.Forbidden, customer.StatusCode);

        await LoginAsync("lender-guard@example.com");
        var lender = await _client.GetAsync("/api/admin/session");
        Assert.Equal(HttpStatusCode.Forbidden, lender.StatusCode);

        await LoginAsync("admin-guard@example.com");
        var admin = await _client.GetAsync("/api/admin/session");
        Assert.Equal(HttpStatusCode.OK, admin.StatusCode);

        using var json = await ReadJsonAsync(admin);
        var data = json.RootElement.GetProperty("data");
        Assert.Equal("admin-guard@example.com", data.GetProperty("email").GetString());
        Assert.Equal("ADMIN", data.GetProperty("role").GetString());
    }

    private async Task LoginAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = Password
        });

        using var json = await ReadJsonAsync(response);
        var token = json.RootElement.GetProperty("data").GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task EnsureUserAsync(string email, string roleCode, bool isActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == roleCode);
        if (role == null)
        {
            role = new Role
            {
                Code = roleCode,
                Name = roleCode,
                Description = $"{roleCode} role"
            };
            dbContext.Roles.Add(role);
            await dbContext.SaveChangesAsync();
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user == null)
        {
            user = new User
            {
                Name = email,
                Email = email,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
                RoleId = role.Id,
                IsActive = isActive,
                CreatedAt = DateTime.UtcNow
            };
            dbContext.Users.Add(user);
        }
        else
        {
            user.RoleId = role.Id;
            user.IsActive = isActive;
        }

        await dbContext.SaveChangesAsync();
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }
}
