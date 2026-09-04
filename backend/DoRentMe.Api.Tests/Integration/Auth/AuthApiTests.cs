using System.IdentityModel.Tokens.Jwt;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Data;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using System.Security.Claims;
namespace DoRentMe.Api.Tests.Auth;

public class AuthApiTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public AuthApiTests()
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
    public async Task Register_WithValidRequest_ReturnsOkAndCreatesUser()
    {
        var request = new
        {
            name = "Nguyen Van A",
            email = "nguyenvana@gmail.com",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.True(
            data.GetProperty("userId").GetInt32() > 0);

        Assert.Equal(
            "Nguyen Van A",
            data.GetProperty("name").GetString());

        Assert.Equal(
            "nguyenvana@gmail.com",
            data.GetProperty("email").GetString());

        Assert.Equal(
            "0901234567",
            data.GetProperty("phone").GetString());

        Assert.Equal(
            "CUSTOMER",
            data.GetProperty("role").GetString());

        Assert.Equal(
            0,
            data.GetProperty("loyaltyPoints").GetInt32());

        var token = data.GetProperty("token").GetString();

        Assert.False(
            string.IsNullOrWhiteSpace(token));

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var user = await dbContext.Users
            .Include(u => u.Role)
            .SingleAsync(u => u.Email == "nguyenvana@gmail.com");

        Assert.True(user.Id > 0);
        Assert.Equal("Nguyen Van A", user.Name);
        Assert.Equal("nguyenvana@gmail.com", user.Email);
        Assert.Equal("0901234567", user.Phone);
        Assert.Equal("CUSTOMER", user.Role.Code);
        Assert.Equal(0, user.LoyaltyPoints);
        Assert.True(user.IsActive);

        Assert.NotEqual(
            "Password123!",
            user.PasswordHash);

        Assert.True(
            BCrypt.Net.BCrypt.Verify(
                "Password123!",
                user.PasswordHash));

        Assert.Equal(
            user.Id,
            data.GetProperty("userId").GetInt32());
    }

    [Fact]
    public async Task Register_WithoutPhone_ReturnsOkAndStoresNullPhone()
    {
        var request = new
        {
            name = "No Phone User",
            email = "nophone@gmail.com",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.Equal(
            "nophone@gmail.com",
            data.GetProperty("email").GetString());

        if (data.TryGetProperty("phone", out var phone))
        {
            Assert.Equal(
                JsonValueKind.Null,
                phone.ValueKind);
        }

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var user = await dbContext.Users
            .SingleAsync(u => u.Email == "nophone@gmail.com");

        Assert.Null(user.Phone);
    }

    [Fact]
    public async Task Register_WithoutRole_UsesCustomerByDefault()
    {
        var request = new
        {
            name = "Default Role User",
            email = "defaultrole@gmail.com",
            phone = "0901234568",
            password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var data = json.RootElement.GetProperty("data");

        Assert.Equal(
            "CUSTOMER",
            data.GetProperty("role").GetString());

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var user = await dbContext.Users
            .Include(u => u.Role)
            .SingleAsync(u => u.Email == "defaultrole@gmail.com");

        Assert.Equal(
            "CUSTOMER",
            user.Role.Code);
    }

    [Fact]
    public async Task Register_WithLenderRole_ReturnsOkAndStoresLenderRole()
    {
        var request = new
        {
            name = "Lender User",
            email = "lender@gmail.com",
            phone = "0901234569",
            password = "Password123!",
            role = "LENDER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var data = json.RootElement.GetProperty("data");

        Assert.Equal(
            "LENDER",
            data.GetProperty("role").GetString());

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var user = await dbContext.Users
            .Include(u => u.Role)
            .SingleAsync(u => u.Email == "lender@gmail.com");

        Assert.Equal(
            "LENDER",
            user.Role.Code);
    }

    [Fact]
    public async Task Register_WithDuplicateEmail_ReturnsBadRequest()
    {
        var firstRequest = new
        {
            name = "First User",
            email = "duplicate@gmail.com",
            phone = "0901111111",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var secondRequest = new
        {
            name = "Second User",
            email = "duplicate@gmail.com",
            phone = "0902222222",
            password = "Password456!",
            role = "CUSTOMER"
        };

        var firstResponse = await _client.PostAsJsonAsync(
            "/api/auth/register",
            firstRequest);

        Assert.Equal(
            HttpStatusCode.OK,
            firstResponse.StatusCode);

        var secondResponse = await _client.PostAsJsonAsync(
            "/api/auth/register",
            secondRequest);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            secondResponse.StatusCode);

        await AssertApiErrorAsync(
            secondResponse,
            ErrorCodes.DuplicateEmail,
            "Email already exists");

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        Assert.Equal(
            1,
            await dbContext.Users.CountAsync(
                u => u.Email == "duplicate@gmail.com"));
    }

    [Fact]
    public async Task Register_WithoutName_ReturnsBadRequest()
    {
        var request = new
        {
            email = "noname@gmail.com",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "name");
    }

    [Fact]
    public async Task Register_WithoutEmail_ReturnsBadRequest()
    {
        var request = new
        {
            name = "No Email User",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "email");
    }

    [Fact]
    public async Task Register_WithInvalidEmail_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Invalid Email User",
            email = "abc",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "email");
    }

    [Fact]
    public async Task Register_WithInvalidPhone_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Invalid Phone User",
            email = "invalidphone@gmail.com",
            phone = "not-a-phone",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "phone");
    }

    [Fact]
    public async Task Register_WithoutPassword_ReturnsBadRequest()
    {
        var request = new
        {
            name = "No Password User",
            email = "nopassword@gmail.com",
            phone = "0901234567",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "password");
    }

    [Fact]
    public async Task Register_WithPasswordShorterThanSixCharacters_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Short Password User",
            email = "shortpassword@gmail.com",
            phone = "0901234567",
            password = "12345",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "password");
    }

    [Fact]
    public async Task Register_WithNameLongerThanOneHundredCharacters_ReturnsBadRequest()
    {
        var request = new
        {
            name = new string('A', 101),
            email = "longname@gmail.com",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "name");
    }


    [Fact]
    public async Task Register_WithEmailLongerThanOneHundredFiftyCharacters_ReturnsBadRequest()
    {
        var localPart = new string('a', 141);

        var request = new
        {
            name = "Long Email User",
            email = $"{localPart}@gmail.com",
            phone = "0901234567",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "email");
    }

    [Fact]
    public async Task Register_WithPhoneLongerThanTwentyCharacters_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Long Phone User",
            email = "longphone@gmail.com",
            phone = "+841234567890123456789",
            password = "Password123!",
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "phone");
    }

    [Fact]
    public async Task Register_WithPasswordLongerThanOneHundredCharacters_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Long Password User",
            email = "longpassword@gmail.com",
            phone = "0901234567",
            password = new string('P', 101),
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "password");
    }

    [Fact]
    public async Task Register_WithInvalidRole_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Invalid Role User",
            email = "invalidrole@gmail.com",
            phone = "0901234567",
            password = "Password123!",
            role = "ADMIN"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "role");
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkAndToken()
    {
        const string email = "loginvalid@gmail.com";
        const string password = "Password123!";

        await RegisterUserAsync(
            "Login Valid User",
            email,
            password);

        var request = new
        {
            email,
            password
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.Equal(
            email,
            data.GetProperty("email").GetString());

        Assert.Equal(
            "Login Valid User",
            data.GetProperty("name").GetString());

        Assert.Equal(
            "CUSTOMER",
            data.GetProperty("role").GetString());

        Assert.Equal(
            0,
            data.GetProperty("loyaltyPoints").GetInt32());

        Assert.False(
            string.IsNullOrWhiteSpace(
                data.GetProperty("token").GetString()));
    }

    [Fact]
    public async Task Login_WithUnknownEmail_ReturnsUnauthorized()
    {
        var request = new
        {
            email = "unknown@gmail.com",
            password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);

        await AssertApiErrorAsync(
            response,
            ErrorCodes.InvalidCredentials,
            "Invalid email or password");
    }

    [Fact]
    public async Task Login_WithWrongPassword_ReturnsUnauthorized()
    {
        const string email = "wrongpassword@gmail.com";

        await RegisterUserAsync(
            "Wrong Password User",
            email,
            "CorrectPassword123!");

        var request = new
        {
            email,
            password = "WrongPassword123!"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);

        await AssertApiErrorAsync(
            response,
            ErrorCodes.InvalidCredentials,
            "Invalid email or password");
    }

    [Fact]
    public async Task Login_WithDisabledAccount_ReturnsForbidden()
    {
        const string email = "disabled@gmail.com";
        const string password = "Password123!";

        await RegisterUserAsync(
            "Disabled User",
            email,
            password);

        using (var scope = _factory.Services.CreateScope())
        {
            var dbContext =
                scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

            var user = await dbContext.Users
                .SingleAsync(u => u.Email == email);

            user.IsActive = false;

            await dbContext.SaveChangesAsync();
        }

        var request = new
        {
            email,
            password
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.Forbidden,
            response.StatusCode);

        await AssertApiErrorAsync(
            response,
            ErrorCodes.AccountDisabled,
            "Account has been disabled");
    }

    [Fact]
    public async Task Login_WithoutEmail_ReturnsBadRequest()
    {
        var request = new
        {
            password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "email");
    }

    [Fact]
    public async Task Login_WithInvalidEmail_ReturnsBadRequest()
    {
        var request = new
        {
            email = "abc",
            password = "Password123!"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "email");
    }

    [Fact]
    public async Task Login_WithoutPassword_ReturnsBadRequest()
    {
        var request = new
        {
            email = "nopasswordlogin@gmail.com"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/login",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        await AssertValidationErrorContainsPathAsync(
            response,
            "password");
    }

    [Fact]
    public async Task Logout_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.PostAsync(
            "/api/auth/logout",
            null);

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task Logout_WithValidToken_ReturnsOk()
    {
        var token = await RegisterUserAndGetTokenAsync(
            "Logout User",
            "logout@gmail.com",
            "Password123!");

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "/api/auth/logout");

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                token);

        var response = await _client.SendAsync(request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        Assert.Equal(
            "Logged out successfully",
            root.GetProperty("data").GetString());
    }

    [Fact]
    public async Task GetCurrentUser_WithoutToken_ReturnsUnauthorized()
    {
        var response = await _client.GetAsync(
            "/api/auth/me");

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task GetCurrentUser_WithValidToken_ReturnsClaims()
    {
        const string name = "Current User";
        const string email = "currentuser@gmail.com";

        var token = await RegisterUserAndGetTokenAsync(
            name,
            email,
            "Password123!");

        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/auth/me");

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                token);

        var response = await _client.SendAsync(request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.False(
            string.IsNullOrWhiteSpace(
                data.GetProperty("userId").GetString()));

        Assert.Equal(
            email,
            data.GetProperty("email").GetString());

        Assert.Equal(
            name,
            data.GetProperty("name").GetString());

        Assert.Equal(
            "CUSTOMER",
            data.GetProperty("role").GetString());
    }

    [Fact]
    public async Task GetCurrentUser_WithMalformedToken_ReturnsUnauthorized()
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Get,
            "/api/auth/me");

        request.Headers.Authorization =
            new AuthenticationHeaderValue(
                "Bearer",
                "not-a-valid-jwt");

        var response = await _client.SendAsync(request);

        Assert.Equal(
            HttpStatusCode.Unauthorized,
            response.StatusCode);
    }

    [Fact]
    public async Task Register_ReturnedJwtContainsExpectedClaims()
    {
        const string name = "Jwt Claims User";
        const string email = "jwtclaims@gmail.com";

        var token = await RegisterUserAndGetTokenAsync(
            name,
            email,
            "Password123!");

        var handler = new JwtSecurityTokenHandler();

        var jwt = handler.ReadJwtToken(token);

        Assert.Equal(
            "DoRentMe",
            jwt.Issuer);

        Assert.Contains(
            "DoRentMe",
            jwt.Audiences);

        Assert.Equal(
            email,
            jwt.Claims
                .Single(c => c.Type == ClaimTypes.Email)
                .Value);

        Assert.Equal(
            name,
            jwt.Claims
                .Single(c => c.Type == ClaimTypes.Name)
                .Value);

        Assert.Equal(
            "CUSTOMER",
            jwt.Claims
                .Single(c => c.Type == ClaimTypes.Role)
                .Value);

        Assert.False(
            string.IsNullOrWhiteSpace(
                jwt.Claims
                    .Single(c => c.Type == ClaimTypes.NameIdentifier)
                    .Value));

        Assert.False(
            string.IsNullOrWhiteSpace(
                jwt.Claims
                    .Single(c => c.Type == "role_id")
                    .Value));

        Assert.False(
            string.IsNullOrWhiteSpace(
                jwt.Claims
                    .Single(c => c.Type == JwtRegisteredClaimNames.Jti)
                    .Value));

        Assert.True(
            jwt.ValidTo > DateTime.UtcNow);
    }

    private async Task RegisterUserAsync(
        string name,
        string email,
        string password)
    {
        var request = new
        {
            name,
            email,
            phone = "0901234567",
            password,
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);
    }

    private async Task<string> RegisterUserAndGetTokenAsync(
        string name,
        string email,
        string password)
    {
        var request = new
        {
            name,
            email,
            phone = "0901234567",
            password,
            role = "CUSTOMER"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/auth/register",
            request);

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var token = json.RootElement
            .GetProperty("data")
            .GetProperty("token")
            .GetString();

        Assert.False(
            string.IsNullOrWhiteSpace(token));

        return token!;
    }

    private static async Task AssertApiErrorAsync(
        HttpResponseMessage response,
        string expectedCode,
        string expectedMessage)
    {
        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.False(
            root.GetProperty("success").GetBoolean());

        var error = root.GetProperty("error");

        Assert.Equal(
            expectedCode,
            error.GetProperty("code").GetString());

        Assert.Equal(
            expectedMessage,
            error.GetProperty("message").GetString());

        Assert.False(
            string.IsNullOrWhiteSpace(
                error.GetProperty("requestId").GetString()));
    }

    private static async Task AssertValidationErrorContainsPathAsync(
        HttpResponseMessage response,
        string expectedPath)
    {
        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.False(
            root.GetProperty("success").GetBoolean());

        var error = root.GetProperty("error");

        Assert.Equal(
            ErrorCodes.ValidationError,
            error.GetProperty("code").GetString());

        Assert.Equal(
            "One or more validation errors occurred.",
            error.GetProperty("message").GetString());

        Assert.False(
            string.IsNullOrWhiteSpace(
                error.GetProperty("requestId").GetString()));

        var details = error.GetProperty("details");

        Assert.True(
            details.GetArrayLength() > 0);

        Assert.Contains(
            details.EnumerateArray(),
            detail =>
                string.Equals(
                    detail.GetProperty("path")[0].GetString(),
                    expectedPath,
                    StringComparison.OrdinalIgnoreCase));
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var content =
            await response.Content.ReadAsStringAsync();

        return JsonDocument.Parse(content);
    }
}
