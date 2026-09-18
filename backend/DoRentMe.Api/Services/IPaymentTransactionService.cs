using DoRentMe.Api.Contracts.Payment;

namespace DoRentMe.Api.Services;

public interface IPaymentTransactionService
{
    Task<PayOsCheckoutResponse> CreatePayOsPaymentAsync(int userId, int orderId, PayOsPaymentRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentTransactionResponse>> GetCustomerTransactionsAsync(int userId, int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminTransactionsAsync(int paymentId, CancellationToken cancellationToken = default);
    Task<PaymentTransactionResponse> GetAdminTransactionAsync(int transactionId, CancellationToken cancellationToken = default);
    Task ProcessPayOsWebhookAsync(PayOsWebhookRequest request, CancellationToken cancellationToken = default);
}
