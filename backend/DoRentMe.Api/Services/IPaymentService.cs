using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services;

public interface IPaymentService
{
    Task CreatePendingPaymentAsync(Order order, CancellationToken cancellationToken = default);

    Task<PaymentResponse> GetCustomerPaymentAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default);

    Task<PaymentResponse> GetAdminPaymentAsync(
        int orderId,
        CancellationToken cancellationToken = default);

    Task<PaymentResponse> UpdateStatusAsync(
        int adminUserId,
        int paymentId,
        PaymentStatusUpdateRequest request,
        CancellationToken cancellationToken = default);

    Task CancelPendingPaymentAsync(
        int orderId,
        CancellationToken cancellationToken = default);
}
