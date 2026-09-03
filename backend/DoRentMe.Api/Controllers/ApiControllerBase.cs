using DoRentMe.Api.Common.Responses;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult Success<T>(T data)
    {
        return Ok(ApiResponse<T>.Ok(data));
    }

    protected IActionResult CreatedSuccess<T>(T data)
    {
        return StatusCode(
            StatusCodes.Status201Created,
            ApiResponse<T>.Ok(data));
    }
}