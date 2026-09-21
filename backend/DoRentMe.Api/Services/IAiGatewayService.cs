using DoRentMe.Api.Contracts.Ai;

namespace DoRentMe.Api.Services;

public interface IAiGatewayService
{
    Task<AiGatewayResult> GenerateChatAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken);

    Task<AiGatewayResult> CreateTryOnAsync(
        TryOnCreateRequest request,
        CancellationToken cancellationToken);

    Task<AiGatewayResult> GetTryOnStatusAsync(
        string requestId,
        CancellationToken cancellationToken);
}

public sealed record AiGatewayResult(
    int StatusCode,
    string Content);
