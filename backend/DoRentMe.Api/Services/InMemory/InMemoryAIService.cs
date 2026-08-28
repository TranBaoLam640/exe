using DoRentMe.Api.Contracts;
using DoRentMe.Api.Services.Abstractions;

namespace DoRentMe.Api.Services.InMemory;

public sealed class InMemoryAIService : IAIService
{
    public Task<ChatResponse> SendChatMessageAsync(ChatRequest request, CancellationToken cancellationToken)
    {
        var response = new ChatResponse("AI service placeholder is ready for Gemini integration.", []);
        return Task.FromResult(response);
    }

    public Task<TryOnSubmitResponse> SubmitTryOnAsync(TryOnSubmitRequest request, CancellationToken cancellationToken)
    {
        var response = new TryOnSubmitResponse(Guid.NewGuid().ToString("N"), "pending");
        return Task.FromResult(response);
    }

    public Task<TryOnStatusResponse> GetTryOnStatusAsync(string requestId, CancellationToken cancellationToken)
    {
        var response = new TryOnStatusResponse(requestId, "pending", ImageUrl: null);
        return Task.FromResult(response);
    }
}
