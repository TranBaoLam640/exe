using DoRentMe.Api.Contracts.Brand;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace DoRentMe.Api.Services;

public class BrandService : IBrandService
{
    private readonly DoRentMeDbContext _dbContext;

    public BrandService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Brand> CreateAsync(
        BrandRequests request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Brands
            .AnyAsync(
                b => b.Name == name || b.Slug == slug,
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "BRAND_ALREADY_EXISTS",
                message: "Brand already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var brand = new Brand
        {
            Name = name,
            Slug = slug
        };

        _dbContext.Brands.Add(brand);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return brand;
    }

    public async Task<List<Brand>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Brands
            .AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Brand?> GetByIdAsync(
    int id,
    CancellationToken cancellationToken)
    {
        return await _dbContext.Brands
            .AsNoTracking()
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);
    }

    public async Task<Brand> UpdateAsync(
    int id,
    UpdateBrandRequest request,
    CancellationToken cancellationToken)
    {
        var brand = await _dbContext.Brands
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        var name = request.Name.Trim();
        var slug = GenerateSlug(name);

        var exists = await _dbContext.Brands
            .AnyAsync(
                b => b.Id != id &&
                     (b.Name == name || b.Slug == slug),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                "BRAND_ALREADY_EXISTS",
                "Brand already exists.",
                StatusCodes.Status400BadRequest);
        }

        brand.Name = name;
        brand.Slug = slug;
        brand.IsActive = request.IsActive;
        brand.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return brand;
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var brand = await _dbContext.Brands
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        _dbContext.Brands.Remove(brand);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
    
    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}
