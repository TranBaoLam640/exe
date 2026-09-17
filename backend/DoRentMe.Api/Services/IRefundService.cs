using DoRentMe.Api.Contracts.Refund;

namespace DoRentMe.Api.Services;

public interface IRefundService
{
    Task CreateOrderCancellationRefundIfRequiredAsync(int orderId, int requestedByUserId, CancellationToken cancellationToken = default);
    Task<RefundResponse> CreateDepositSettlementAsync(int adminUserId, int orderId, DepositSettlementRequest request, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RefundResponse>> GetCustomerRefundsAsync(int userId, int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RefundResponse>> GetAdminRefundsAsync(RefundFilters filters, CancellationToken cancellationToken = default);
    Task<RefundResponse> GetAdminRefundAsync(int refundId, CancellationToken cancellationToken = default);
    Task<RefundResponse> UpdateStatusAsync(int adminUserId, int refundId, RefundStatusUpdateRequest request, CancellationToken cancellationToken = default);
}
