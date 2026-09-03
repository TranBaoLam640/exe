using Microsoft.AspNetCore.Mvc;
using DoRentMe.Api.Common.Responses;

namespace DoRentMe.Api.Controllers;

[Route("api/health")]
public sealed class HealthController : ApiControllerBase
{
    [HttpGet]
    [ProducesResponseType(
        typeof(ApiResponse<HealthResponse>),
        StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        var response = new HealthResponse(
            "ok",
            DateTimeOffset.UtcNow);

        return Success(response);
    }
}

public sealed record HealthResponse(string Status, DateTimeOffset CheckedAt);
