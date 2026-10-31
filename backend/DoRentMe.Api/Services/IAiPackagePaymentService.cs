using DoRentMe.Api.Contracts.Payment;

namespace DoRentMe.Api.Services;

public interface IAiPackagePaymentService
{
    Task<AiPackagePaymentResponse> CreatePaymentAsync(string packageId, CancellationToken cancellationToken = default);
    Task<AiPackagePaymentResponse> GetStatusAsync(long orderCode, CancellationToken cancellationToken = default);
    Task<AiPackagePaymentResponse> ClaimAsync(long orderCode, CancellationToken cancellationToken = default);
}

