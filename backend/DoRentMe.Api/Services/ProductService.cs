using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ProductService : IProductService
{
    private readonly DoRentMeDbContext _dbContext;

    public ProductService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProductResponse> CreateAsync(
        ProductCreateRequest request,
        CancellationToken cancellationToken = default)
    {
        // 1. Check Shop
        var shopExists = await _dbContext.Shops
            .AnyAsync(
                s => s.Id == request.ShopId && s.IsActive,
                cancellationToken);

        if (!shopExists)
        {
            throw new ApiException(
                ErrorCodes.ShopNotFound,
                "Shop does not exist or is inactive.",
                StatusCodes.Status404NotFound);
        }

        // 2. Check Brand nếu có
        if (request.BrandId.HasValue)
        {
            var brandExists = await _dbContext.Brands
                .AnyAsync(
                    b => b.Id == request.BrandId.Value &&
                         b.IsActive,
                    cancellationToken);

            if (!brandExists)
            {
                throw new ApiException(
                    ErrorCodes.BrandNotFound,
                    "Brand does not exist or is inactive.",
                    StatusCodes.Status404NotFound);
            }
        }

        // 3. Loại CategoryId bị duplicate
        var categoryIds = request.CategoryIds
            .Distinct()
            .ToList();

        // 4. Check Category
        var existingCategoryIds = await _dbContext.Categories
            .Where(c =>
                categoryIds.Contains(c.Id) &&
                c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        if (existingCategoryIds.Count != categoryIds.Count)
        {
            throw new ApiException(
                ErrorCodes.CategoryNotFound,
                "One or more categories do not exist or are inactive.",
                StatusCodes.Status404NotFound);
        }

        // 5. Create Product
        var product = new Product
        {
            ShopId = request.ShopId,
            BrandId = request.BrandId,

            Name = request.Name.Trim(),
            Slug = GenerateSlug(request.Name),

            Description = request.Description?.Trim(),

            Price1Day = request.Price1Day,
            Price3Day = request.Price3Day,
            ExtraDayPrice = request.ExtraDayPrice,

            PriceTag = request.PriceTag,
            PriceDeposit = request.PriceDeposit,

            PurchaseCost = request.PurchaseCost,
            CleaningCost = request.CleaningCost,
            MaintenanceCost = request.MaintenanceCost,

            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // 6. Product - Category many-to-many
        product.ProductCategories = categoryIds
            .Select(categoryId => new ProductCategory
            {
                CategoryId = categoryId
            })
            .ToList();

        // 7. Variants
        product.Variants = request.Variants
    .Select(v => new ProductVariant
    {
        Size = v.Size.Trim(),
        Color = v.Color.Trim(),
        IsActive = true,
        CreatedAt = DateTime.UtcNow
    })
    .ToList();

        // 8. Add Product
        _dbContext.Products.Add(product);

        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var variant in product.Variants)
        {
            variant.VariantCode = GenerateVariantCode(
                product.Id,
                variant.Size,
                variant.Color);
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
        // 9. Load lại navigation properties để response có đầy đủ data
        var createdProduct = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.Brand)
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Variants)
            .FirstAsync(
                p => p.Id == product.Id,
                cancellationToken);

        // 10. Response
        return MapToResponse(createdProduct);
    }

    private static ProductResponse MapToResponse(Product product)
    {
        return new ProductResponse
        {
            Id = product.Id,
            ShopId = product.ShopId ?? 0,
            BrandId = product.BrandId,

            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,

            Price1Day = product.Price1Day,
            Price3Day = product.Price3Day,
            ExtraDayPrice = product.ExtraDayPrice,

            PriceTag = product.PriceTag,
            PriceDeposit = product.PriceDeposit,

            PurchaseCost = product.PurchaseCost,
            CleaningCost = product.CleaningCost,
            MaintenanceCost = product.MaintenanceCost,

            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,

            Categories = product.ProductCategories
                .Select(pc => new ProductCategoryResponse
                {
                    Id = pc.Category.Id,
                    Name = pc.Category.Name,
                    Slug = pc.Category.Slug
                })
                .ToList(),

            Variants = product.Variants
                .Select(v => new ProductVariantResponse
                {
                    Id = v.Id,
                    Size = v.Size,
                    Color = v.Color,
                    VariantCode = v.VariantCode,
                    IsActive = v.IsActive
                })
                .ToList()
        };
    }

    private static string GenerateVariantCode(
        int productId,
        string size,
        string color)
    {
        var cleanSize = size
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "-");

        var cleanColor = color
            .Trim()
            .ToUpperInvariant()
            .Replace(" ", "-");

        return $"PRD{productId}-{cleanSize}-{cleanColor}";
    }
    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }

    public async Task<ProductResponse> GetByIdAsync(
    int id,
    CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(
                p => p.Id == id,
                cancellationToken);

        if (product == null)
        {
            throw new ApiException(
                ErrorCodes.ProductNotFound,
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        return MapToResponse(product);
    }

    public async Task<List<ProductResponse>> GetAllAsync(
    CancellationToken cancellationToken = default)
    {
        var products = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Variants)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);

        return products
            .Select(MapToResponse)
            .ToList();
    }

    public async Task<ProductResponse> UpdateAsync(
    int id,
    ProductUpdateRequest request,
    CancellationToken cancellationToken = default)
    {
        // 1. Tìm Product
        var product = await _dbContext.Products
            .Include(p => p.ProductCategories)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(
                p => p.Id == id,
                cancellationToken);

        if (product == null)
        {
            throw new ApiException(
                ErrorCodes.ProductNotFound,
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        // 2. Validate Brand nếu có
        if (request.BrandId.HasValue)
        {
            var brandExists = await _dbContext.Brands
                .AnyAsync(
                    b => b.Id == request.BrandId.Value &&
                         b.IsActive,
                    cancellationToken);

            if (!brandExists)
            {
                throw new ApiException(
                    ErrorCodes.BrandNotFound,
                    "Brand does not exist or is inactive.",
                    StatusCodes.Status404NotFound);
            }
        }

        // 3. Loại CategoryId duplicate
        var categoryIds = request.CategoryIds
            .Distinct()
            .ToList();

        // 4. Validate Category
        var existingCategoryIds = await _dbContext.Categories
            .Where(c =>
                categoryIds.Contains(c.Id) &&
                c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        if (existingCategoryIds.Count != categoryIds.Count)
        {
            throw new ApiException(
                ErrorCodes.CategoryNotFound,
                "One or more categories do not exist or are inactive.",
                StatusCodes.Status404NotFound);
        }

        // 5. Update thông tin Product
        product.BrandId = request.BrandId;

        product.Name = request.Name.Trim();
        product.Slug = GenerateSlug(request.Name);

        product.Description = request.Description?.Trim();

        product.Price1Day = request.Price1Day;
        product.Price3Day = request.Price3Day;
        product.ExtraDayPrice = request.ExtraDayPrice;

        product.PriceTag = request.PriceTag;
        product.PriceDeposit = request.PriceDeposit;

        product.PurchaseCost = request.PurchaseCost;
        product.CleaningCost = request.CleaningCost;
        product.MaintenanceCost = request.MaintenanceCost;

        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        // 6. Thay toàn bộ Category cũ
        _dbContext.ProductCategories.RemoveRange(
            product.ProductCategories);

        product.ProductCategories = categoryIds
            .Select(categoryId => new ProductCategory
            {
                ProductId = product.Id,
                CategoryId = categoryId
            })
            .ToList();

        // 7. Update / Create Variant
        foreach (var variantRequest in request.Variants)
        {
            // Variant cũ
            if (variantRequest.Id.HasValue)
            {
                var variant = product.Variants
                    .FirstOrDefault(v =>
                        v.Id == variantRequest.Id.Value);

                if (variant == null)
                {
                    throw new ApiException(
                        ErrorCodes.BadRequest,
                        $"Variant {variantRequest.Id.Value} does not belong to this product.",
                        StatusCodes.Status400BadRequest);
                }

                variant.Size = variantRequest.Size.Trim();
                variant.Color = variantRequest.Color.Trim();

                variant.VariantCode = GenerateVariantCode(
                    product.Id,
                    variant.Size,
                    variant.Color);

                variant.IsActive = variantRequest.IsActive;
                variant.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                // Variant mới
                var newVariant = new ProductVariant
                {
                    ProductId = product.Id,

                    Size = variantRequest.Size.Trim(),
                    Color = variantRequest.Color.Trim(),

                    IsActive = variantRequest.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                newVariant.VariantCode = GenerateVariantCode(
                    product.Id,
                    newVariant.Size,
                    newVariant.Color);

                product.Variants.Add(newVariant);
            }
        }

        // 8. Save
        await _dbContext.SaveChangesAsync(cancellationToken);

        // 9. Load lại để trả response
        var updatedProduct = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Variants)
            .FirstAsync(
                p => p.Id == id,
                cancellationToken);

        return MapToResponse(updatedProduct);
    }

    public async Task<ProductResponse> DeleteAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(
                p => p.Id == id,
                cancellationToken);

        if (product == null)
        {
            throw new ApiException(
                ErrorCodes.ProductNotFound,
                "Product not found.",
                StatusCodes.Status404NotFound);
        }

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapToResponse(product);
    }
}