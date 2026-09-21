using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using DoRentMe.Api.Contracts.Ai;

namespace DoRentMe.Api.Services;

public sealed class AiGatewayService : IAiGatewayService
{
    private const string GeminiModel = "gemini-3.5-flash-lite";
    private const string FashnBaseUrl = "https://api.fashn.ai/v1";

    private static readonly JsonSerializerOptions JsonOptions = new(
        JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AiGatewayService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<AiGatewayResult> GenerateChatAsync(
        ChatCompletionRequest request,
        CancellationToken cancellationToken)
    {
        var apiKey = _configuration["GEMINI_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Error(
                StatusCodes.Status500InternalServerError,
                "GEMINI_API_KEY chua duoc cau hinh tren server");
        }

        var body = new JsonObject
        {
            ["system_instruction"] = new JsonObject
            {
                ["parts"] = new JsonArray(
                    new JsonObject
                    {
                        ["text"] = request.System
                    })
            },
            ["contents"] = CloneJsonNode(request.Messages)
        };

        if (request.GenerationConfig is { ValueKind: not JsonValueKind.Undefined and not JsonValueKind.Null } generationConfig)
        {
            body["generationConfig"] = CloneJsonNode(generationConfig);
        }

        using var content = JsonContent(body);
        using var response = await _httpClient.PostAsync(
            $"https://generativelanguage.googleapis.com/v1beta/models/{GeminiModel}:generateContent?key={Uri.EscapeDataString(apiKey)}",
            content,
            cancellationToken);

        return await ReadProviderResponseAsync(response, cancellationToken);
    }

    public async Task<AiGatewayResult> CreateTryOnAsync(
        TryOnCreateRequest request,
        CancellationToken cancellationToken)
    {
        var apiKey = _configuration["FASHN_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Error(
                StatusCodes.Status500InternalServerError,
                "FASHN_API_KEY chua duoc cau hinh tren server");
        }

        using var httpRequest = new HttpRequestMessage(
            HttpMethod.Post,
            $"{FashnBaseUrl}/run");

        httpRequest.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        httpRequest.Content = JsonContent(new
        {
            model_name = "tryon-max",
            inputs = new
            {
                model_image = request.HumanImage,
                product_image = request.GarmentImageUrl,
                resolution = "1k"
            }
        });

        using var response = await _httpClient.SendAsync(
            httpRequest,
            cancellationToken);

        var providerBody = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Error(
                (int)response.StatusCode,
                ReadErrorMessage(
                    providerBody,
                    "Khong gui duoc yeu cau toi FASHN AI."));
        }

        using var json = JsonDocument.Parse(providerBody);
        var root = json.RootElement;
        if (TryGetErrorMessage(root, out var errorMessage))
        {
            return Error(
                StatusCodes.Status400BadRequest,
                errorMessage);
        }

        if (!root.TryGetProperty("id", out var idElement)
            || idElement.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(idElement.GetString()))
        {
            return Error(
                StatusCodes.Status502BadGateway,
                "FASHN AI khong tra ve request id hop le.");
        }

        return JsonResult(StatusCodes.Status200OK, new
        {
            requestId = idElement.GetString()
        });
    }

    public async Task<AiGatewayResult> GetTryOnStatusAsync(
        string requestId,
        CancellationToken cancellationToken)
    {
        var apiKey = _configuration["FASHN_API_KEY"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return Error(
                StatusCodes.Status500InternalServerError,
                "FASHN_API_KEY chua duoc cau hinh tren server");
        }

        using var httpRequest = new HttpRequestMessage(
            HttpMethod.Get,
            $"{FashnBaseUrl}/status/{Uri.EscapeDataString(requestId)}");

        httpRequest.Headers.Authorization =
            new AuthenticationHeaderValue("Bearer", apiKey);

        using var response = await _httpClient.SendAsync(
            httpRequest,
            cancellationToken);

        var providerBody = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            return Error(
                (int)response.StatusCode,
                ReadErrorMessage(
                    providerBody,
                    "Khong kiem tra duoc trang thai xu ly."));
        }

        using var json = JsonDocument.Parse(providerBody);
        var root = json.RootElement;
        if (TryGetErrorMessage(root, out var errorMessage))
        {
            return Error(StatusCodes.Status400BadRequest, errorMessage);
        }

        var providerStatus = root.TryGetProperty("status", out var statusElement)
            && statusElement.ValueKind == JsonValueKind.String
                ? statusElement.GetString()
                : null;
        var status = NormalizeTryOnStatus(providerStatus);

        var result = new JsonObject
        {
            ["status"] = status
        };

        if (string.Equals(
                providerStatus,
                "completed",
                StringComparison.OrdinalIgnoreCase)
            && root.TryGetProperty("output", out var outputElement)
            && outputElement.ValueKind == JsonValueKind.Array
            && outputElement.GetArrayLength() > 0
            && outputElement[0].ValueKind == JsonValueKind.String)
        {
            result["image"] = new JsonObject
            {
                ["url"] = outputElement[0].GetString()
            };
        }

        return new AiGatewayResult(
            StatusCodes.Status200OK,
            result.ToJsonString(JsonOptions));
    }

    private static StringContent JsonContent<T>(T value)
    {
        return new StringContent(
            JsonSerializer.Serialize(value, JsonOptions),
            Encoding.UTF8,
            "application/json");
    }

    private static JsonNode? CloneJsonNode(JsonElement element)
    {
        return JsonNode.Parse(element.GetRawText());
    }

    private static async Task<AiGatewayResult> ReadProviderResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var content = await response.Content.ReadAsStringAsync(
            cancellationToken);

        return new AiGatewayResult(
            (int)response.StatusCode,
            content);
    }

    private static AiGatewayResult Error(
        int statusCode,
        string message)
    {
        return JsonResult(statusCode, new
        {
            error = new
            {
                message
            }
        });
    }

    private static AiGatewayResult JsonResult<T>(
        int statusCode,
        T value)
    {
        return new AiGatewayResult(
            statusCode,
            JsonSerializer.Serialize(value, JsonOptions));
    }

    private static string ReadErrorMessage(
        string body,
        string fallback)
    {
        if (string.IsNullOrWhiteSpace(body))
        {
            return fallback;
        }

        try
        {
            using var json = JsonDocument.Parse(body);
            return TryGetErrorMessage(json.RootElement, out var message)
                ? message
                : fallback;
        }
        catch (JsonException)
        {
            return fallback;
        }
    }

    private static bool TryGetErrorMessage(
        JsonElement root,
        out string message)
    {
        message = string.Empty;

        if (!root.TryGetProperty("error", out var errorElement))
        {
            return false;
        }

        if (errorElement.ValueKind == JsonValueKind.String)
        {
            message = errorElement.GetString() ?? string.Empty;
        }
        else if (errorElement.ValueKind == JsonValueKind.Object
            && errorElement.TryGetProperty("message", out var messageElement)
            && messageElement.ValueKind == JsonValueKind.String)
        {
            message = messageElement.GetString() ?? string.Empty;
        }

        return !string.IsNullOrWhiteSpace(message);
    }

    private static string? NormalizeTryOnStatus(string? status)
    {
        return status?.ToLowerInvariant() switch
        {
            "starting" => "IN_QUEUE",
            "in_queue" => "IN_QUEUE",
            "processing" => "IN_PROGRESS",
            "completed" => "COMPLETED",
            "failed" => "FAILED",
            _ => status
        };
    }
}
