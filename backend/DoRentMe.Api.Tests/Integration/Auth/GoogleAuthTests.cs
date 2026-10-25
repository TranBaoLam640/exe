using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Json;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text.Json;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Services;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Xunit;

namespace DoRentMe.Api.Tests.Auth;

public class GoogleAuthTests
{
    private const string ClientId = "123-test.apps.googleusercontent.com";

    [Theory]
    [InlineData("valid", 200)]
    [InlineData("audience", 401)]
    [InlineData("issuer", 401)]
    [InlineData("expired", 401)]
    [InlineData("signature", 401)]
    [InlineData("unverified", 401)]
    [InlineData("subject", 401)]
    [InlineData("missing-config", 503)]
    public async Task Validator_OnlyAcceptsVerifiedSignedGoogleTokens(string scenario, int status)
    {
        using var rsa = RSA.Create(2048);
        using var otherRsa = RSA.Create(2048);
        var key = new RsaSecurityKey(rsa) { KeyId = "test-key" };
        var wrongKey = new RsaSecurityKey(otherRsa) { KeyId = "test-key" };
        var metadata = new OpenIdConnectConfiguration();
        metadata.SigningKeys.Add(key);
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["GoogleAuth:ClientId"] = scenario == "missing-config" ? "" : ClientId
        }).Build();
        var validator = new GoogleTokenValidator(config, new StaticConfigurationManager<OpenIdConnectConfiguration>(metadata));
        var claims = new List<Claim>
        {
            new("email", "customer@gmail.com"),
            new("email_verified", scenario == "unverified" ? "false" : "true", ClaimValueTypes.Boolean),
            new("name", "Customer")
        };
        if (scenario != "subject") claims.Add(new Claim("sub", "google-subject"));
        var jwt = new JwtSecurityToken(
            issuer: scenario == "issuer" ? "https://attacker.example" : "https://accounts.google.com",
            audience: scenario == "audience" ? "wrong-client" : ClientId,
            claims: claims,
            notBefore: DateTime.UtcNow.AddHours(-2),
            expires: scenario == "expired" ? DateTime.UtcNow.AddMinutes(-10) : DateTime.UtcNow.AddMinutes(10),
            signingCredentials: new SigningCredentials(scenario == "signature" ? wrongKey : key, SecurityAlgorithms.RsaSha256));
        var token = new JwtSecurityTokenHandler().WriteToken(jwt);
        if (status == 200)
        {
            var identity = await validator.ValidateAsync(token);
            Assert.Equal("google-subject", identity.Subject);
            Assert.Equal("customer@gmail.com", identity.Email);
            Assert.True(identity.CanLinkByEmail);
        }
        else
        {
            var exception = await Assert.ThrowsAsync<ApiException>(() => validator.ValidateAsync(token));
            Assert.Equal(status, exception.StatusCode);
        }
    }

    [Fact]
    public async Task GoogleLogin_CreatesRealSessionAndReusesAccountBySubject()
    {
        using var factory = new CustomWebApplicationFactory();
        using var app = WithGoogle(factory);
        using var client = app.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/google", new { idToken = "valid", email = "attacker@example.com", role = "ADMIN" });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        var data = json.RootElement.GetProperty("data");
        var id = data.GetProperty("userId").GetInt32();
        Assert.Equal("CUSTOMER", data.GetProperty("role").GetString());
        client.DefaultRequestHeaders.Authorization = new("Bearer", data.GetProperty("token").GetString());
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/api/auth/me")).StatusCode);
        var second = await client.PostAsJsonAsync("/api/auth/google", new { idToken = "valid" });
        using var secondJson = JsonDocument.Parse(await second.Content.ReadAsStringAsync());
        Assert.Equal(id, secondJson.RootElement.GetProperty("data").GetProperty("userId").GetInt32());
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal(1, await db.Users.CountAsync(u => u.GoogleSubject == "subject-123"));
    }

    [Theory]
    [InlineData(true)]
    [InlineData(false)]
    public async Task GoogleLogin_LinksExistingAccountButRejectsDisabledUsers(bool active)
    {
        using var factory = new CustomWebApplicationFactory();
        using var app = WithGoogle(factory);
        using var client = app.CreateClient();
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
            var role = await db.Roles.SingleAsync(r => r.Code == "LENDER");
            db.Users.Add(new User { Name = "Existing", Email = "customer@gmail.com", RoleId = role.Id, PasswordHash = "existing-hash", IsActive = active });
            await db.SaveChangesAsync();
        }
        var response = await client.PostAsJsonAsync("/api/auth/google", new { idToken = "valid" });
        Assert.Equal(active ? HttpStatusCode.OK : HttpStatusCode.Forbidden, response.StatusCode);
        using var checkScope = app.Services.CreateScope();
        var checkDb = checkScope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var user = await checkDb.Users.SingleAsync(u => u.Email == "customer@gmail.com");
        Assert.Equal("existing-hash", user.PasswordHash);
        Assert.Equal(active ? "subject-123" : null, user.GoogleSubject);
        if (active)
        {
            using var json = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
            Assert.Equal("LENDER", json.RootElement.GetProperty("data").GetProperty("role").GetString());
        }
    }

    [Fact]
    public async Task GoogleLogin_DoesNotLinkThirdPartyEmailWithoutAccountVerification()
    {
        using var factory = new CustomWebApplicationFactory();
        using var app = WithGoogle(factory);
        using var client = app.CreateClient();
        using (var scope = app.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
            var role = await db.Roles.SingleAsync(r => r.Code == "CUSTOMER");
            db.Users.Add(new User { Name = "Existing", Email = "customer@example.com", RoleId = role.Id, PasswordHash = "existing-hash" });
            await db.SaveChangesAsync();
        }
        var response = await client.PostAsJsonAsync("/api/auth/google", new { idToken = "external" });
        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        using var checkScope = app.Services.CreateScope();
        var user = await checkScope.ServiceProvider.GetRequiredService<DoRentMeDbContext>().Users.SingleAsync(u => u.Email == "customer@example.com");
        Assert.Null(user.GoogleSubject);
    }

    [Theory]
    [InlineData("", 400)]
    [InlineData("invalid", 401)]
    public async Task GoogleLogin_RejectsMissingOrRejectedCredential(string token, int status)
    {
        using var factory = new CustomWebApplicationFactory();
        using var app = WithGoogle(factory);
        using var client = app.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/google", new { idToken = token, email = "attacker@gmail.com", role = "ADMIN" });
        Assert.Equal(status, (int)response.StatusCode);
        using var scope = app.Services.CreateScope();
        Assert.False(await scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>().Users.AnyAsync(u => u.Email == "attacker@gmail.com"));
    }

    private static Microsoft.AspNetCore.Mvc.Testing.WebApplicationFactory<Program> WithGoogle(CustomWebApplicationFactory factory) =>
        factory.WithWebHostBuilder(builder => builder.ConfigureServices(services =>
        {
            services.RemoveAll<IGoogleTokenValidator>();
            services.AddSingleton<IGoogleTokenValidator>(new FakeGoogleTokens());
        }));

    private class FakeGoogleTokens : IGoogleTokenValidator
    {
        public Task<GoogleIdentity> ValidateAsync(string token)
        {
            if (token == "external") return Task.FromResult(new GoogleIdentity("external-subject", "customer@example.com", "Customer", false));
            if (token != "valid") throw new ApiException("INVALID_GOOGLE_CREDENTIAL", "Invalid credential", 401);
            return Task.FromResult(new GoogleIdentity("subject-123", "customer@gmail.com", "Customer", true));
        }
    }
}
