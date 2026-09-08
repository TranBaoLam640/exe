using DoRentMe.Api.Contracts.Category;

namespace DoRentMe.Api.Services;

public interface ICategoryService
{
    Task<List<CategoryReadResponse>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<CategoryReadResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken);

    Task<CategoryReadResponse> CreateAsync(
        CategoryCreateRequest request,
        CancellationToken cancellationToken);

    Task<CategoryReadResponse?> UpdateAsync(
        int id,
        CategoryUpdateRequest request,
        CancellationToken cancellationToken);

    Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken);
}