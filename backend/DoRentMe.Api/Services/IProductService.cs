using DoRentMe.Api.Contracts.Product;

namespace DoRentMe.Api.Services;

public interface IProductService
{
    Task<ProductResponse> CreateAsync(
        ProductCreateRequest request,
        CancellationToken cancellationToken = default);

    Task<List<ProductResponse>> GetAllAsync(
    CancellationToken cancellationToken = default);

    Task<ProductResponse> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<ProductResponse> UpdateAsync(
    int id,
    ProductUpdateRequest request,
    CancellationToken cancellationToken = default);

    Task<ProductResponse> DeleteAsync(
    int id,
    CancellationToken cancellationToken = default);
}