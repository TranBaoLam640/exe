using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Services;

namespace DoRentMe.Api.Tests.Infrastructure;

public sealed class FakePaymentGateway : IPaymentGateway
{
    public Task<PaymentGatewayCreateResult> CreatePaymentAsync(PaymentGatewayCreateRequest request, CancellationToken cancellationToken = default)
    {
        return Task.FromResult(new PaymentGatewayCreateResult(
            $"https://payos.test/checkout/{request.ProviderOrderCode}",
            $"qr-{request.ProviderOrderCode}",
            $"provider-{request.ProviderOrderCode}",
            null));
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
