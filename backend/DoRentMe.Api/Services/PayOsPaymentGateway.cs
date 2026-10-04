using DoRentMe.Api.Contracts.Payment;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using System.Globalization;
using System.Net.Http.Headers;
using System.Text.Json;

namespace DoRentMe.Api.Services;

public class PayOsOptions
{
    public string? ClientId { get; set; }
    public string? ApiKey { get; set; }
    public string? ChecksumKey { get; set; }
    public string? ReturnUrl { get; set; }
    public string? CancelUrl { get; set; }
}

public class PayOsPaymentGateway : IPaymentGateway
{
    private static readonly HttpClient StatusClient = new()
    {
        BaseAddress = new Uri("https://api-merchant.payos.vn/")
    };
    private readonly IOptions<PayOsOptions> _options;

    public PayOsPaymentGateway(IOptions<PayOsOptions> options)
    {
        _options = options;
    }

    public async Task<PaymentGatewayCreateResult> CreatePaymentAsync(PaymentGatewayCreateRequest request, CancellationToken cancellationToken = default)
    {
        var client = CreateClient();
        var result = await client.PaymentRequests.CreateAsync(new CreatePaymentLinkRequest
        {
            OrderCode = request.ProviderOrderCode,
            Amount = request.Amount,
            Description = request.Description,
            ReturnUrl = request.ReturnUrl,
            CancelUrl = request.CancelUrl
        });
        return new PaymentGatewayCreateResult(result.CheckoutUrl, result.QrCode, result.PaymentLinkId, null);
    }

    public async Task<PaymentGatewayStatusResult> GetPaymentStatusAsync(long providerOrderCode, CancellationToken cancellationToken = default)
    {
        EnsureConfigured();
        using var request = new HttpRequestMessage(HttpMethod.Get, $"v2/payment-requests/{providerOrderCode.ToString(CultureInfo.InvariantCulture)}");
        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        request.Headers.TryAddWithoutValidation("x-client-id", _options.Value.ClientId);
        request.Headers.TryAddWithoutValidation("x-api-key", _options.Value.ApiKey);

        using var response = await StatusClient.SendAsync(request, cancellationToken);
        response.EnsureSuccessStatusCode();
        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var json = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var data = json.RootElement.GetProperty("data");
        var status = GetString(data, "status") ?? string.Empty;
        var amount = GetDecimal(data, "amount");
        var providerTransactionId = GetString(data, "id") ?? GetString(data, "paymentLinkId");
        return new PaymentGatewayStatusResult(providerOrderCode, amount, providerTransactionId, status, string.Equals(status, "PAID", StringComparison.OrdinalIgnoreCase));
    }

    public async Task<PaymentGatewayWebhookResult> VerifyWebhookAsync(PayOsWebhookRequest request, CancellationToken cancellationToken = default)
    {
        var client = CreateClient();
        var verified = await client.Webhooks.VerifyAsync(new Webhook
        {
            Code = request.Code,
            Description = request.Description,
            Success = request.Success,
            Signature = request.Signature,
            Data = new WebhookData
            {
                OrderCode = Convert.ToInt64(request.Data.OrderCode),
                Amount = Convert.ToInt64(request.Data.Amount),
                Reference = request.Data.Reference,
                PaymentLinkId = request.Data.PaymentLinkId,
                Code = request.Data.Code,
                Description = request.Data.Description,
                TransactionDateTime = request.Data.TransactionDateTime
            }
        });
        return new PaymentGatewayWebhookResult(verified.OrderCode, verified.Amount, verified.Reference, request.Success && request.Code == "00");
    }

    private PayOSClient CreateClient()
    {
        EnsureConfigured();

        return new PayOSClient(new PayOSOptions
        {
            ClientId = _options.Value.ClientId,
            ApiKey = _options.Value.ApiKey,
            ChecksumKey = _options.Value.ChecksumKey
        });
    }

    private void EnsureConfigured()
    {
        if (string.IsNullOrWhiteSpace(_options.Value.ClientId)
            || string.IsNullOrWhiteSpace(_options.Value.ApiKey)
            || string.IsNullOrWhiteSpace(_options.Value.ChecksumKey))
        {
            throw new InvalidOperationException("PayOS is not configured.");
        }
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
        return element.TryGetProperty(propertyName, out var value) && value.ValueKind != JsonValueKind.Null
            ? value.GetString()
            : null;
    }

    private static decimal GetDecimal(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var value)) return 0;
        return value.ValueKind switch
        {
            JsonValueKind.Number => value.GetDecimal(),
            JsonValueKind.String when decimal.TryParse(value.GetString(), NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed) => parsed,
            _ => 0
        };
    }
}
