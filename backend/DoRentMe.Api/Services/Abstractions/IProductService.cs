using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services.Abstractions;

public interface IProductService
{
    Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken);
    Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Product>> SearchAsync(string query, CancellationToken cancellationToken);
    Task<IReadOnlyList<Product>> GetByCategoryAsync(string category, CancellationToken cancellationToken);
}
