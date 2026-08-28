using DoRentMe.Api.Contracts;

namespace DoRentMe.Api.Services.Abstractions;

public interface IAIService
{
    Task<ChatResponse> SendChatMessageAsync(ChatRequest request, CancellationToken cancellationToken);
    Task<TryOnSubmitResponse> SubmitTryOnAsync(TryOnSubmitRequest request, CancellationToken cancellationToken);
    Task<TryOnStatusResponse> GetTryOnStatusAsync(string requestId, CancellationToken cancellationToken);
}
