using DoRentMe.Api.Contracts.Brand;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services;

public interface IBrandService
{
    Task<Brand> CreateAsync(
        BrandRequests request,
        CancellationToken cancellationToken);

    Task<List<Brand>> GetAllAsync(
        CancellationToken cancellationToken);

    Task<Brand?> GetByIdAsync(
       int id,
       CancellationToken cancellationToken);

    Task<Brand> UpdateAsync(
 int id,
 UpdateBrandRequest request,
 CancellationToken cancellationToken);

 Task DeleteAsync(
    int id,
    CancellationToken cancellationToken);
    
}