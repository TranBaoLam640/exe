using System.Text.Json;
using System.Text.Json.Serialization;

namespace DoRentMe.Api.Contracts.Ai;

public sealed class ChatCompletionRequest
{
    [JsonPropertyName("messages")]
    public JsonElement Messages { get; init; }

    [JsonPropertyName("system")]
    public string? System { get; init; }

    [JsonPropertyName("generationConfig")]
    public JsonElement? GenerationConfig { get; init; }
}
