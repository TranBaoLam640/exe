using System.Text.Json.Serialization;

namespace DoRentMe.Api.Contracts.Ai;

public sealed class TryOnCreateRequest
{
    [JsonPropertyName("humanImage")]
    public string? HumanImage { get; init; }

    [JsonPropertyName("garmentImageUrl")]
    public string? GarmentImageUrl { get; init; }
}
