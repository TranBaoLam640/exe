using DoRentMe.Api.Contracts.Order;

namespace DoRentMe.Api.Services;

public interface IOrderService
{
    Task<CheckoutResponse> CheckoutAsync(
        int userId,
        CheckoutRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<OrderResponse>> GetCustomerOrdersAsync(
        int userId,
        CancellationToken cancellationToken = default);

    Task<OrderResponse> GetCustomerOrderAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default);

    Task<OrderResponse> CancelAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default);

    Task<OrderResponse> UpdateStatusAsync(
        int userId,
        string role,
        int orderId,
        OrderStatusUpdateRequest request,
        CancellationToken cancellationToken = default);
}
