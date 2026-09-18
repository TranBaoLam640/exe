using DoRentMe.Api.Contracts.Inspection;

namespace DoRentMe.Api.Services;

public interface IReturnInspectionService
{
    Task<IReadOnlyList<ReturnInspectionResponse>> GetAdminInspectionsAsync(int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReturnInspectionAssetResponse>> GetAdminAssetsAsync(int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ReturnInspectionResponse>> GetCustomerInspectionsAsync(int userId, int orderId, CancellationToken cancellationToken = default);
    Task<ReturnInspectionResponse> GetAsync(int inspectionId, CancellationToken cancellationToken = default);
    Task<ReturnInspectionResponse> CreateAsync(int adminUserId, int orderId, ReturnInspectionRequest request, CancellationToken cancellationToken = default);
    Task<ReturnInspectionResponse> UpdateAsync(int adminUserId, int inspectionId, ReturnInspectionRequest request, CancellationToken cancellationToken = default);
    Task<InspectionSummaryResponse> GetSummaryAsync(int orderId, bool requireComplete, CancellationToken cancellationToken = default);
}
