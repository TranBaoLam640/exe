using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Contracts.Ai;
using DoRentMe.Api.Services;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace DoRentMe.Api.Tests.Ai;

public class AiApiTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;
    private readonly FakeAiGatewayService _aiGatewayService;

    public AiApiTests()
    {
        _aiGatewayService = new FakeAiGatewayService();
        _factory = new CustomWebApplicationFactory();
        _client = _factory
            .WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    services.RemoveAll<IAiGatewayService>();
                    services.AddSingleton<IAiGatewayService>(_aiGatewayService);
                });
            })
            .CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task Chat_WithValidRequest_ReturnsProviderPayloadDirectly()
    {
        _aiGatewayService.ChatResult = new AiGatewayResult(
            StatusCodes.Status200OK,
            """
            {"candidates":[{"content":{"parts":[{"text":"{\"reply\":\"pong\",\"recommendedProducts\":[]}"}]}}]}
            """);

        var response = await _client.PostAsJsonAsync(
            "/api/chat",
            new
            {
                messages = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new { text = "ping" }
                        }
                    }
                },
                system = "Reply as JSON.",
                generationConfig = new
                {
                    responseMimeType = "application/json"
                }
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        var candidates = json.RootElement.GetProperty("candidates");

        Assert.Equal(1, candidates.GetArrayLength());
        Assert.Equal("Reply as JSON.", _aiGatewayService.ChatRequest?.System);
    }

    [Fact]
    public async Task Chat_WithMissingSystem_ReturnsLegacyBadRequest()
    {
        var response = await _client.PostAsJsonAsync(
            "/api/chat",
            new
            {
                messages = Array.Empty<object>()
            });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var json = await ReadJsonAsync(response);

        Assert.Equal(
            "Missing messages or system prompt",
            json.RootElement.GetProperty("error").GetString());
    }

    [Fact]
    public async Task TryOnCreate_WithValidRequest_ReturnsRequestIdDirectly()
    {
        _aiGatewayService.CreateTryOnResult = new AiGatewayResult(
            StatusCodes.Status200OK,
            """{"requestId":"req_123"}""");

        var response = await _client.PostAsJsonAsync(
            "/api/tryon",
            new
            {
                humanImage = "data:image/jpeg;base64,abc",
                garmentImageUrl = "https://assets.example.com/product.jpg"
            });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);

        Assert.Equal(
            "req_123",
            json.RootElement.GetProperty("requestId").GetString());
        Assert.Equal(
            "https://assets.example.com/product.jpg",
            _aiGatewayService.TryOnRequest?.GarmentImageUrl);
    }

    [Fact]
    public async Task TryOnStatus_WithValidId_ReturnsNormalizedPayloadDirectly()
    {
        _aiGatewayService.TryOnStatusResult = new AiGatewayResult(
            StatusCodes.Status200OK,
            """{"status":"COMPLETED","image":{"url":"https://assets.example.com/result.png"}}""");

        var response = await _client.GetAsync("/api/tryon?id=req_123");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);

        Assert.Equal(
            "COMPLETED",
            json.RootElement.GetProperty("status").GetString());
        Assert.Equal("req_123", _aiGatewayService.StatusRequestId);
    }

    [Fact]
    public async Task TryOnStatus_WithoutId_ReturnsLegacyBadRequest()
    {
        var response = await _client.GetAsync("/api/tryon");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

        using var json = await ReadJsonAsync(response);

        Assert.Equal(
            "Thieu request id",
            json.RootElement
                .GetProperty("error")
                .GetProperty("message")
                .GetString());
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        return JsonDocument.Parse(content);
    }

    private sealed class FakeAiGatewayService : IAiGatewayService
    {
        public AiGatewayResult ChatResult { get; set; } =
            new(StatusCodes.Status200OK, "{}");

        public AiGatewayResult CreateTryOnResult { get; set; } =
            new(StatusCodes.Status200OK, """{"requestId":"req_123"}""");

        public AiGatewayResult TryOnStatusResult { get; set; } =
            new(StatusCodes.Status200OK, """{"status":"IN_QUEUE"}""");

        public ChatCompletionRequest? ChatRequest { get; private set; }

        public TryOnCreateRequest? TryOnRequest { get; private set; }

        public string? StatusRequestId { get; private set; }

        public Task<AiGatewayResult> GenerateChatAsync(
            ChatCompletionRequest request,
            CancellationToken cancellationToken)
        {
            ChatRequest = request;

            return Task.FromResult(ChatResult);
        }

        public Task<AiGatewayResult> CreateTryOnAsync(
            TryOnCreateRequest request,
            CancellationToken cancellationToken)
        {
            TryOnRequest = request;

            return Task.FromResult(CreateTryOnResult);
        }

        public Task<AiGatewayResult> GetTryOnStatusAsync(
            string requestId,
            CancellationToken cancellationToken)
        {
            StatusRequestId = requestId;

            return Task.FromResult(TryOnStatusResult);
        }
    }
}
