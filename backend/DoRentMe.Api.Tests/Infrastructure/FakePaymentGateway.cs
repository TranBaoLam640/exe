using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Services;
using System.Collections.Concurrent;

namespace DoRentMe.Api.Tests.Infrastructure;

public sealed class FakePaymentGateway : IPaymentGateway
{
    private readonly ConcurrentDictionary<long, int> _amounts = new();

    public Task<PaymentGatewayCreateResult> CreatePaymentAsync(PaymentGatewayCreateRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Description.Length > 9)
        {
            throw new InvalidOperationException("PayOS descriptions must be 9 characters or fewer.");
        }

        _amounts[request.ProviderOrderCode] = request.Amount;

        return Task.FromResult(new PaymentGatewayCreateResult(
            $"https://payos.test/checkout/{request.ProviderOrderCode}",
            $"qr-{request.ProviderOrderCode}",
            $"provider-{request.ProviderOrderCode}",
            null));
    }

    public Task<PaymentGatewayStatusResult> GetPaymentStatusAsync(long providerOrderCode, CancellationToken cancellationToken = default)
    {
        _amounts.TryGetValue(providerOrderCode, out var amount);
        return Task.FromResult(new PaymentGatewayStatusResult(providerOrderCode, amount, $"provider-{providerOrderCode}", "PENDING", false));
    }

    public Task<PaymentGatewayWebhookResult> VerifyWebhookAsync(PayOsWebhookRequest request, CancellationToken cancellationToken = default)
    {
        if (request.Signature != "valid-test-signature")
        {
            throw new InvalidOperationException("Invalid test signature.");
        }

        return Task.FromResult(new PaymentGatewayWebhookResult(
            request.Data.OrderCode,
            request.Data.Amount,
            request.Data.Reference,
            request.Success && request.Code == "00"));
    }
}
