using DoRentMe.Api.Contracts.Payment;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

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
        if (string.IsNullOrWhiteSpace(_options.Value.ClientId)
            || string.IsNullOrWhiteSpace(_options.Value.ApiKey)
            || string.IsNullOrWhiteSpace(_options.Value.ChecksumKey))
        {
            throw new InvalidOperationException("PayOS is not configured.");
        }

        return new PayOSClient(new PayOSOptions
        {
            ClientId = _options.Value.ClientId,
            ApiKey = _options.Value.ApiKey,
            ChecksumKey = _options.Value.ChecksumKey
        });
    }
}
