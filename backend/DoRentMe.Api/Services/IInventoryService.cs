using DoRentMe.Api.Contracts.Inventory;

namespace DoRentMe.Api.Services;

public interface IInventoryService
{
    Task<IReadOnlyList<InventoryResponse>> GetAllAsync(
        InventoryQueryRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<InventoryResponse> GetByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<InventoryResponse>> GetByProductAsync(
        int productId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<ProductAvailabilityResponse> GetProductAvailabilityAsync(
        int productId,
        DateOnly? startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken = default);

    Task<InventoryResponse> CreateAsync(
        int productId,
        int variantId,
        InventoryCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<InventoryResponse> UpdateAsync(
        int id,
        InventoryUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<InventoryResponse> UpdateStatusAsync(
        int id,
        InventoryStatusRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);
}
