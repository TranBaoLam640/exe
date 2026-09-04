using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Auth;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace DoRentMe.Api.Services;

public class AuthService : IAuthService
{
    private readonly DoRentMeDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        DoRentMeDbContext context,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (existingUser != null)
        {
            throw new ApiException(
                ErrorCodes.DuplicateEmail,
                "Email already exists",
                400);
        }

        // Get role
        var role = await _context.Roles
            .FirstOrDefaultAsync(r => r.Code == request.Role);

        if (role == null)
        {
            throw new ApiException(
                ErrorCodes.InvalidRole,
                "Invalid role specified",
                400);
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create user
        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Phone = request.Phone,
            PasswordHash = passwordHash,
            RoleId = role.Id,
            LoyaltyPoints = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Load role for response
        await _context.Entry(user).Reference(u => u.Role).LoadAsync();

        _logger.LogInformation("User registered successfully: {Email}", user.Email);

        // Generate token
        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role.Code,
            Token = token,
            LoyaltyPoints = user.LoyaltyPoints
        };
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Find user by email
        var user = await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user == null)
        {
            throw new ApiException(
                ErrorCodes.InvalidCredentials,
                "Invalid email or password",
                401);
        }

        // Check if user is active
        if (!user.IsActive)
        {
            throw new ApiException(
                ErrorCodes.AccountDisabled,
                "Account has been disabled",
                403);
        }

        // Verify password
        var isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

        if (!isPasswordValid)
        {
            throw new ApiException(
                ErrorCodes.InvalidCredentials,
                "Invalid email or password",
                401);
        }

        _logger.LogInformation("User logged in successfully: {Email}", user.Email);

        // Generate token
        var token = GenerateJwtToken(user);

        return new AuthResponse
        {
            UserId = user.Id,
            Name = user.Name,
            Email = user.Email,
            Phone = user.Phone,
            Role = user.Role.Code,
            Token = token,
            LoyaltyPoints = user.LoyaltyPoints
        };
    }

    private string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey not configured");
        var issuer = jwtSettings["Issuer"] ?? "DoRentMe";
        var audience = jwtSettings["Audience"] ?? "DoRentMe";
        var expiryMinutes = int.Parse(jwtSettings["ExpiryMinutes"] ?? "1440");

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role.Code),
            new Claim("role_id", user.RoleId.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
