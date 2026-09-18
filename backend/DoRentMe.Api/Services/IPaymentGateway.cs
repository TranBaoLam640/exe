using DoRentMe.Api.Contracts.Payment;

namespace DoRentMe.Api.Services;

public record PaymentGatewayCreateRequest(long ProviderOrderCode, int Amount, string Description, string ReturnUrl, string CancelUrl);
public record PaymentGatewayCreateResult(string CheckoutUrl, string? QrCode, string? ProviderTransactionId, DateTime? ExpiredAt);
public record PaymentGatewayWebhookResult(long ProviderOrderCode, decimal Amount, string? ProviderTransactionId, bool IsSuccessful);

public interface IPaymentGateway
{
    Task<PaymentGatewayCreateResult> CreatePaymentAsync(PaymentGatewayCreateRequest request, CancellationToken cancellationToken = default);
    Task<PaymentGatewayWebhookResult> VerifyWebhookAsync(PayOsWebhookRequest request, CancellationToken cancellationToken = default);
}
