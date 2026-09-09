using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Contracts.Common;

namespace DoRentMe.Api.Services;

public interface IProductService
{
    Task<ProductResponse> CreateAsync(
        ProductCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<ProductResponse>> GetAllAsync(
        ProductQueryRequest request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> GetByIdAsync(
        int id,
        int? currentUserId = null,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> UpdateAsync(
        int id,
        ProductUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<List<ProductImageResponse>> GetImagesAsync(
        int productId,
        CancellationToken cancellationToken = default);

    Task<ProductImageResponse> AddImageAsync(
        int productId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<ProductImageResponse> UpdateImageAsync(
        int productId,
        int imageId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<bool> DeleteImageAsync(
        int productId,
        int imageId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> FavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> UnfavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<ProductResponse>> GetFavoritesAsync(
        ProductQueryRequest request,
        int currentUserId,
        CancellationToken cancellationToken = default);
}
