using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Common;
using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ProductService : IProductService
{
    private const string AdminRole = "ADMIN";
    private const string LenderRole = "LENDER";
    private const string AvailableInventoryStatus = "AVAILABLE";

    private readonly DoRentMeDbContext _dbContext;

    public ProductService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProductResponse> CreateAsync(
        ProductCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageShopAsync(request.ShopId, currentUserId, currentUserRole, cancellationToken);
        await ValidateBrandAsync(request.BrandId, cancellationToken);
        var categoryIds = await ValidateCategoriesAsync(request.CategoryIds, cancellationToken);
        ValidateVariants(request.Variants.Select(v => (v.Size, v.Color)));

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
            CreatedAt = DateTime.UtcNow,
            ProductCategories = categoryIds
                .Select(categoryId => new ProductCategory { CategoryId = categoryId })
                .ToList(),
            Variants = request.Variants
                .Select(v => new ProductVariant
                {
                    Size = v.Size.Trim(),
                    Color = v.Color.Trim(),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList()
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var variant in product.Variants)
        {
            variant.VariantCode = GenerateVariantCode(product.Id, variant.Size, variant.Color);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<PagedResponse<ProductResponse>> GetAllAsync(
        ProductQueryRequest request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        return await GetPublicProductsAsync(request, currentUserId, null, cancellationToken);
    }

    public async Task<ProductResponse> GetByIdAsync(
        int id,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var product = await PublicProductQuery()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        return await MapToResponseAsync(product, currentUserId, true, cancellationToken);
    }

    public async Task<ProductResponse> UpdateAsync(
        int id,
        ProductUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .Include(p => p.ProductCategories)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);
        await ValidateBrandAsync(request.BrandId, cancellationToken);
        var categoryIds = await ValidateCategoriesAsync(request.CategoryIds, cancellationToken);
        ValidateVariants(request.Variants.Select(v => (v.Size, v.Color)));

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

        _dbContext.ProductCategories.RemoveRange(product.ProductCategories);
        product.ProductCategories = categoryIds
            .Select(categoryId => new ProductCategory
            {
                ProductId = product.Id,
                CategoryId = categoryId
            })
            .ToList();

        foreach (var variantRequest in request.Variants)
        {
            if (variantRequest.Id.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == variantRequest.Id.Value);
                if (variant == null)
                {
                    throw new ApiException(
                        ErrorCodes.BadRequest,
                        $"Variant {variantRequest.Id.Value} does not belong to this product.",
                        StatusCodes.Status400BadRequest);
                }

                variant.Size = variantRequest.Size.Trim();
                variant.Color = variantRequest.Color.Trim();
                variant.VariantCode = GenerateVariantCode(product.Id, variant.Size, variant.Color);
                variant.IsActive = variantRequest.IsActive;
                variant.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newVariant = new ProductVariant
                {
                    ProductId = product.Id,
                    Size = variantRequest.Size.Trim(),
                    Color = variantRequest.Color.Trim(),
                    IsActive = variantRequest.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                newVariant.VariantCode = GenerateVariantCode(product.Id, newVariant.Size, newVariant.Color);
                product.Variants.Add(newVariant);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<ProductResponse> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<List<ProductImageResponse>> GetImagesAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        await EnsurePublicProductExistsAsync(productId, cancellationToken);

        return await _dbContext.ProductImages
            .AsNoTracking()
            .Where(i => i.ProductId == productId)
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(i => MapImage(i))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductImageResponse> AddImageAsync(
        int productId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        if (request.IsPrimary)
        {
            await ClearPrimaryImageAsync(productId, null, cancellationToken);
        }

        var image = new ProductImage
        {
            ProductId = productId,
            ImageUrl = request.ImageUrl.Trim(),
            IsPrimary = request.IsPrimary,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProductImages.Add(image);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapImage(image);
    }

    public async Task<ProductImageResponse> UpdateImageAsync(
        int productId,
        int imageId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var image = await _dbContext.ProductImages
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.Id == imageId, cancellationToken);

        if (image == null)
        {
            throw new ApiException(
                ErrorCodes.NotFound,
                "Product image not found.",
                StatusCodes.Status404NotFound);
        }

        if (request.IsPrimary)
        {
            await ClearPrimaryImageAsync(productId, imageId, cancellationToken);
        }

        image.ImageUrl = request.ImageUrl.Trim();
        image.IsPrimary = request.IsPrimary;
        image.SortOrder = request.SortOrder;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapImage(image);
    }

    public async Task<bool> DeleteImageAsync(
        int productId,
        int imageId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var image = await _dbContext.ProductImages
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.Id == imageId, cancellationToken);

        if (image == null)
        {
            return false;
        }

        _dbContext.ProductImages.Remove(image);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ProductResponse> FavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsurePublicProductExistsAsync(productId, cancellationToken);

        var exists = await _dbContext.ProductLikes
            .AnyAsync(l => l.ProductId == productId && l.UserId == currentUserId, cancellationToken);

        if (!exists)
        {
            _dbContext.ProductLikes.Add(new ProductLike
            {
                ProductId = productId,
                UserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(productId, currentUserId, cancellationToken);
    }

    public async Task<ProductResponse> UnfavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        var like = await _dbContext.ProductLikes
            .FirstOrDefaultAsync(l => l.ProductId == productId && l.UserId == currentUserId, cancellationToken);

        if (like != null)
        {
            _dbContext.ProductLikes.Remove(like);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(productId, currentUserId, cancellationToken);
    }

    public async Task<PagedResponse<ProductResponse>> GetFavoritesAsync(
        ProductQueryRequest request,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await GetPublicProductsAsync(request, currentUserId, currentUserId, cancellationToken);
    }

    private async Task<PagedResponse<ProductResponse>> GetPublicProductsAsync(
        ProductQueryRequest request,
        int? currentUserId,
        int? favoritedByUserId,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize <= 0 ? 20 : request.PageSize, 1, 100);
        var query = ApplyFilters(PublicProductQuery(), request);

        if (favoritedByUserId.HasValue)
        {
            query = query.Where(p => _dbContext.ProductLikes
                .Any(l => l.ProductId == p.Id && l.UserId == favoritedByUserId.Value));
        }

        query = ApplySort(query, request.SortBy, request.SortDirection);

        var totalItems = await query.CountAsync(cancellationToken);
        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = new List<ProductResponse>();
        foreach (var product in products)
        {
            items.Add(await MapToResponseAsync(product, currentUserId, true, cancellationToken));
        }

        return new PagedResponse<ProductResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    private IQueryable<Product> PublicProductQuery()
    {
        return _dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.Shop != null && p.Shop.IsActive)
            .Include(p => p.Shop)
            .Include(p => p.Brand)
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
                .ThenInclude(v => v.InventoryItems)
            .AsSplitQuery();
    }

    private static IQueryable<Product> ApplyFilters(
        IQueryable<Product> query,
        ProductQueryRequest request)
    {
        var search = request.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Name.Contains(search) ||
                (p.Description != null && p.Description.Contains(search)) ||
                (p.Brand != null && p.Brand.Name.Contains(search)) ||
                p.ProductCategories.Any(pc => pc.Category.Name.Contains(search)));
        }

        var categoryIds = request.CategoryIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (categoryIds.Count > 0)
        {
            query = query.Where(p => p.ProductCategories.Any(pc => categoryIds.Contains(pc.CategoryId)));
        }

        if (request.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == request.BrandId.Value);
        }

        if (request.ShopId.HasValue)
        {
            query = query.Where(p => p.ShopId == request.ShopId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Size))
        {
            var size = request.Size.Trim();
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Size == size));
        }

        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            var color = request.Color.Trim();
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Color == color));
        }

        if (!string.IsNullOrWhiteSpace(request.Condition))
        {
            var condition = request.Condition.Trim().ToUpperInvariant();
            query = query.Where(p => p.Variants.Any(v => v.IsActive &&
                v.InventoryItems.Any(i => i.Condition == condition)));
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price1Day >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price1Day <= request.MaxPrice.Value);
        }

        if (request.InStock == true)
        {
            query = query.Where(p => p.Variants.Any(v => v.IsActive &&
                v.InventoryItems.Any(i => i.Status == AvailableInventoryStatus)));
        }

        return query;
    }

    private static IQueryable<Product> ApplySort(
        IQueryable<Product> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = !string.Equals(sortDirection, "asc", StringComparison.OrdinalIgnoreCase);

        return (sortBy ?? "createdAt").Trim().ToLowerInvariant() switch
        {
            "name" => descending
                ? query.OrderByDescending(p => p.Name).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Name).ThenBy(p => p.Id),
            "price1day" => descending
                ? query.OrderByDescending(p => p.Price1Day).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Price1Day).ThenBy(p => p.Id),
            _ => descending
                ? query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id)
        };
    }

    private async Task<ProductResponse> GetManagementProductAsync(
        int id,
        int? currentUserId,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.Shop)
            .Include(p => p.Brand)
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
                .ThenInclude(v => v.InventoryItems)
            .AsSplitQuery()
            .FirstAsync(p => p.Id == id, cancellationToken);

        return await MapToResponseAsync(product, currentUserId, false, cancellationToken);
    }

    private async Task<ProductResponse> MapToResponseAsync(
        Product product,
        int? currentUserId,
        bool publicCatalog,
        CancellationToken cancellationToken)
    {
        var variants = publicCatalog
            ? product.Variants.Where(v => v.IsActive)
            : product.Variants;

        var variantResponses = variants
            .OrderBy(v => v.Size)
            .ThenBy(v => v.Color)
            .Select(v => MapVariant(v, product))
            .ToList();

        var images = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(MapImage)
            .ToList();

        var likeCount = await _dbContext.ProductLikes
            .AsNoTracking()
            .CountAsync(l => l.ProductId == product.Id, cancellationToken);

        var isFavorited = currentUserId.HasValue &&
            await _dbContext.ProductLikes
                .AsNoTracking()
                .AnyAsync(l => l.ProductId == product.Id && l.UserId == currentUserId.Value, cancellationToken);

        return new ProductResponse
        {
            Id = product.Id,
            ShopId = product.ShopId ?? 0,
            BrandId = product.BrandId,
            BrandName = product.Brand?.Name,
            BrandSlug = product.Brand?.Slug,
            ShopName = product.Shop?.Name,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price1Day = product.Price1Day,
            Price3Day = product.Price3Day,
            ExtraDayPrice = product.ExtraDayPrice,
            PriceTag = product.PriceTag,
            PriceDeposit = product.PriceDeposit,
            PurchaseCost = publicCatalog ? null : product.PurchaseCost,
            CleaningCost = publicCatalog ? 0 : product.CleaningCost,
            MaintenanceCost = publicCatalog ? 0 : product.MaintenanceCost,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            Categories = product.ProductCategories
                .OrderBy(pc => pc.Category.Name)
                .Select(pc => new ProductCategoryResponse
                {
                    Id = pc.Category.Id,
                    Name = pc.Category.Name,
                    Slug = pc.Category.Slug
                })
                .ToList(),
            Variants = variantResponses,
            Images = images,
            PrimaryImage = images.FirstOrDefault(i => i.IsPrimary) ?? images.FirstOrDefault(),
            TotalStock = variantResponses.Sum(v => v.TotalStock),
            AvailableStock = variantResponses.Sum(v => v.AvailableStock),
            Conditions = variantResponses
                .SelectMany(v => v.Conditions)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(c => c)
                .ToList(),
            LikeCount = likeCount,
            IsFavorited = isFavorited
        };
    }

    private static ProductVariantResponse MapVariant(ProductVariant variant, Product product)
    {
        var inventoryItems = variant.InventoryItems.ToList();

        return new ProductVariantResponse
        {
            Id = variant.Id,
            Size = variant.Size,
            Color = variant.Color,
            VariantCode = variant.VariantCode,
            IsActive = variant.IsActive,
            TotalStock = inventoryItems.Count,
            AvailableStock = inventoryItems.Count(i => i.Status == AvailableInventoryStatus),
            Conditions = inventoryItems
                .Select(i => i.Condition)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(c => c)
                .ToList(),
            Price = new ProductVariantPriceResponse
            {
                Price1Day = product.Price1Day,
                Price3Day = product.Price3Day,
                ExtraDayPrice = product.ExtraDayPrice,
                PriceDeposit = product.PriceDeposit
            }
        };
    }

    private static ProductImageResponse MapImage(ProductImage image)
    {
        return new ProductImageResponse
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            IsPrimary = image.IsPrimary,
            SortOrder = image.SortOrder,
            CreatedAt = image.CreatedAt
        };
    }

    private async Task<Product> GetProductForManagementAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        return product;
    }

    private async Task EnsurePublicProductExistsAsync(
        int productId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Products
            .AsNoTracking()
            .AnyAsync(p => p.Id == productId && p.IsActive && p.Shop != null && p.Shop.IsActive, cancellationToken);

        if (!exists)
        {
            throw ProductNotFound();
        }
    }

    private async Task EnsureCanManageShopAsync(
        int shopId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken)
    {
        var shop = await _dbContext.Shops
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == shopId && s.IsActive, cancellationToken);

        if (shop == null)
        {
            throw new ApiException(
                ErrorCodes.ShopNotFound,
                "Shop does not exist or is inactive.",
                StatusCodes.Status404NotFound);
        }

        if (IsAdmin(currentUserRole) || IsLenderOwner(currentUserRole, currentUserId, shop.OwnerUserId))
        {
            return;
        }

        throw Forbidden();
    }

    private static void EnsureCanManageProduct(
        Product product,
        int currentUserId,
        string currentUserRole)
    {
        if (IsAdmin(currentUserRole) ||
            (product.Shop != null && IsLenderOwner(currentUserRole, currentUserId, product.Shop.OwnerUserId)))
        {
            return;
        }

        throw Forbidden();
    }

    private async Task ValidateBrandAsync(
        int? brandId,
        CancellationToken cancellationToken)
    {
        if (!brandId.HasValue)
        {
            return;
        }

        var brandExists = await _dbContext.Brands
            .AnyAsync(b => b.Id == brandId.Value && b.IsActive, cancellationToken);

        if (!brandExists)
        {
            throw new ApiException(
                ErrorCodes.BrandNotFound,
                "Brand does not exist or is inactive.",
                StatusCodes.Status404NotFound);
        }
    }

    private async Task<List<int>> ValidateCategoriesAsync(
        IEnumerable<int> requestCategoryIds,
        CancellationToken cancellationToken)
    {
        var categoryIds = requestCategoryIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (categoryIds.Count == 0)
        {
            throw new ApiException(
                ErrorCodes.ValidationError,
                "At least one category is required.",
                StatusCodes.Status400BadRequest);
        }

        var existingCategoryIds = await _dbContext.Categories
            .Where(c => categoryIds.Contains(c.Id) && c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        if (existingCategoryIds.Count != categoryIds.Count)
        {
            throw new ApiException(
                ErrorCodes.CategoryNotFound,
                "One or more categories do not exist or are inactive.",
                StatusCodes.Status404NotFound);
        }

        return categoryIds;
    }

    private static void ValidateVariants(
        IEnumerable<(string Size, string Color)> variants)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var variant in variants)
        {
            if (string.IsNullOrWhiteSpace(variant.Size) || string.IsNullOrWhiteSpace(variant.Color))
            {
                throw new ApiException(
                    ErrorCodes.ValidationError,
                    "Variant size and color are required.",
                    StatusCodes.Status400BadRequest);
            }

            var key = $"{variant.Size.Trim()}|{variant.Color.Trim()}";
            if (!seen.Add(key))
            {
                throw new ApiException(
                    ErrorCodes.BadRequest,
                    "Duplicate variants are not allowed.",
                    StatusCodes.Status400BadRequest);
            }
        }
    }

    private async Task ClearPrimaryImageAsync(
        int productId,
        int? exceptImageId,
        CancellationToken cancellationToken)
    {
        var primaryImages = await _dbContext.ProductImages
            .Where(i => i.ProductId == productId && i.IsPrimary && i.Id != exceptImageId)
            .ToListAsync(cancellationToken);

        foreach (var image in primaryImages)
        {
            image.IsPrimary = false;
        }
    }

    private static bool IsAdmin(string role)
    {
        return string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLenderOwner(string role, int currentUserId, int ownerUserId)
    {
        return string.Equals(role, LenderRole, StringComparison.OrdinalIgnoreCase) &&
            currentUserId == ownerUserId;
    }

    private static ApiException Forbidden()
    {
        return new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to manage this product.",
            StatusCodes.Status403Forbidden);
    }

    private static ApiException ProductNotFound()
    {
        return new ApiException(
            ErrorCodes.ProductNotFound,
            "Product not found.",
            StatusCodes.Status404NotFound);
    }

    private static string GenerateVariantCode(
        int productId,
        string size,
        string color)
    {
        var cleanSize = size.Trim().ToUpperInvariant().Replace(" ", "-");
        var cleanColor = color.Trim().ToUpperInvariant().Replace(" ", "-");

        return $"PRD{productId}-{cleanSize}-{cleanColor}";
    }

    private static string GenerateSlug(string name)
    {
        return name.Trim().ToLowerInvariant().Replace(" ", "-");
    }
}
