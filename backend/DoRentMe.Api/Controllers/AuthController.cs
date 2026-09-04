using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Auth;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/[controller]")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        var result = await _authService.RegisterAsync(request);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(ApiResponse<AuthResponse>.Ok(result));
    }

    [HttpPost("logout")]
    [Authorize]
    public ActionResult<ApiResponse<string>> Logout()
    {
        // JWT is stateless, logout is handled on client side by removing token
        // This endpoint is just for consistency and can be used for logging
        return Ok(ApiResponse<string>.Ok("Logged out successfully"));
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<ApiResponse<object>> GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var name = User.FindFirst(System.Security.Claims.ClaimTypes.Name)?.Value;
        var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        var userInfo = new
        {
            UserId = userId,
            Email = email,
            Name = name,
            Role = role
        };

        return Ok(ApiResponse<object>.Ok(userInfo));
    }
}
