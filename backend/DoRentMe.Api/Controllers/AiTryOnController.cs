using DoRentMe.Api.Contracts.Ai;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/tryon")]
public sealed class AiTryOnController : ControllerBase
{
    private readonly IAiGatewayService _aiGatewayService;

    public AiTryOnController(IAiGatewayService aiGatewayService)
    {
        _aiGatewayService = aiGatewayService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        TryOnCreateRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.HumanImage)
            || string.IsNullOrWhiteSpace(request.GarmentImageUrl))
        {
            return BadRequest(new
            {
                error = new
                {
                    message = "Thieu anh khach hang hoac anh san pham"
                }
            });
        }

        var result = await _aiGatewayService.CreateTryOnAsync(
            request,
            cancellationToken);

        return AiContent(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetStatus(
        [FromQuery] string? id,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new
            {
                error = new
                {
                    message = "Thieu request id"
                }
            });
        }

        var result = await _aiGatewayService.GetTryOnStatusAsync(
            id,
            cancellationToken);

        return AiContent(result);
    }

    private static ContentResult AiContent(AiGatewayResult result)
    {
        return new ContentResult
        {
            StatusCode = result.StatusCode,
            ContentType = "application/json",
            Content = result.Content
        };
    }
}
