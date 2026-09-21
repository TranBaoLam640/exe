using System.Text.Json;
using DoRentMe.Api.Contracts.Ai;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/chat")]
public sealed class AiChatController : ControllerBase
{
    private readonly IAiGatewayService _aiGatewayService;

    public AiChatController(IAiGatewayService aiGatewayService)
    {
        _aiGatewayService = aiGatewayService;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        ChatCompletionRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Messages.ValueKind is JsonValueKind.Undefined or JsonValueKind.Null
            || string.IsNullOrWhiteSpace(request.System))
        {
            return BadRequest(new { error = "Missing messages or system prompt" });
        }

        var result = await _aiGatewayService.GenerateChatAsync(
            request,
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
