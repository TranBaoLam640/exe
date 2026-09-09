using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Category;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly DoRentMeDbContext _dbContext;

    public CategoryService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CategoryReadResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Id)
            .Select(c => new CategoryReadResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryReadResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryReadResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CategoryReadResponse> CreateAsync(
        CategoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Categories
            .AnyAsync(
                c => c.Name == name || c.Slug == slug,
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "CATEGORY_ALREADY_EXISTS",
                message: "Category already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var category = new Category
        {
            Name = name,
            Slug = slug,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Categories.Add(category);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<CategoryReadResponse?> UpdateAsync(
        int id,
        CategoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(
                c => c.Id == id,
                cancellationToken);

        if (category == null)
        {
            return null;
        }

        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Categories
            .AnyAsync(
                c =>
                    c.Id != id &&
                    (c.Name == name || c.Slug == slug),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "CATEGORY_ALREADY_EXISTS",
                message: "Category already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        category.Name = name;
        category.Slug = slug;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(
                c => c.Id == id,
                cancellationToken);

        if (category == null)
        {
            return false;
        }

        var hasProducts = await _dbContext.ProductCategories
    .AnyAsync(
        pc => pc.CategoryId == id,
        cancellationToken);

        if (hasProducts)
        {
            throw new ApiException(
                code: "CATEGORY_IN_USE",
                message: "Category is being used by products.",
                statusCode: StatusCodes.Status409Conflict);
        }

        _dbContext.Categories.Remove(category);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static CategoryReadResponse ToResponse(
        Category category)
    {
        return new CategoryReadResponse
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}
