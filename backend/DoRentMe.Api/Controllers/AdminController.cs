using System.Security.Claims;
using DoRentMe.Api.Common.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ApiControllerBase
{
    [HttpGet("session")]
    [ProducesResponseType(
        typeof(ApiResponse<object>),
        StatusCodes.Status200OK)]
    public IActionResult GetSession()
    {
        var adminSession = new
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value,
            Name = User.FindFirst(ClaimTypes.Name)?.Value,
            Role = User.FindFirst(ClaimTypes.Role)?.Value
        };

        return Success(adminSession);
    }
}
