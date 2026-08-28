using DoRentMe.Api.Contracts;
using DoRentMe.Api.Services.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/ai")]
public sealed class AIController(IAIService ai) : ControllerBase
{
    [HttpPost("chat")]
    public async Task<IActionResult> Chat(ChatRequest request, CancellationToken cancellationToken)
    {
        return Ok(await ai.SendChatMessageAsync(request, cancellationToken));
    }

    [HttpPost("tryon/submit")]
    public async Task<IActionResult> SubmitTryOn(TryOnSubmitRequest request, CancellationToken cancellationToken)
    {
        return Ok(await ai.SubmitTryOnAsync(request, cancellationToken));
    }

    [HttpGet("tryon/status/{requestId}")]
    public async Task<IActionResult> GetTryOnStatus(string requestId, CancellationToken cancellationToken)
    {
        return Ok(await ai.GetTryOnStatusAsync(requestId, cancellationToken));
    }
}
