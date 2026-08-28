namespace DoRentMe.Api.Contracts;

public sealed record ChatMessageDto(string Role, string Content);

public sealed record ChatRequest(IReadOnlyList<ChatMessageDto> Messages);

public sealed record RecommendedProductDto(int Id, string Name, string? ImageUrl);

public sealed record ChatResponse(string Reply, IReadOnlyList<RecommendedProductDto> RecommendedProducts);

public sealed record TryOnSubmitRequest(int ProductId, string HumanImage);

public sealed record TryOnSubmitResponse(string RequestId, string Status);

public sealed record TryOnStatusResponse(string RequestId, string Status, string? ImageUrl);
