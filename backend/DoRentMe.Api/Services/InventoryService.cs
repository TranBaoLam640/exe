using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Inventory;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class InventoryService : IInventoryService
{
    private const string AdminRole = "ADMIN";
    private const string LenderRole = "LENDER";
    private const string AvailableStatus = "AVAILABLE";

    private static readonly string[] ValidConditions = ["NEW", "GOOD", "FAIR", "WORN", "DAMAGED"];
    private static readonly string[] ValidStatuses =
    [
        "AVAILABLE",
        "RESERVED",
        "RENTED",
        "CLEANING",
        "MAINTENANCE",
        "DAMAGED",
        "LOST",
        "RETIRED"
    ];

    private readonly DoRentMeDbContext _dbContext;

    public InventoryService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<InventoryResponse>> GetAllAsync(
        InventoryQueryRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyManagementScope(InventoryQuery(), currentUserId, currentUserRole);

        if (request.ProductId.HasValue)
        {
            query = query.Where(item => item.ProductVariant.ProductId == request.ProductId.Value);
        }

        if (request.VariantId.HasValue)
        {
            query = query.Where(item => item.ProductVariantId == request.VariantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = NormalizeStatus(request.Status);
            EnsureValidStatus(status);
            query = query.Where(item => item.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Condition))
        {
            var condition = NormalizeCondition(request.Condition);
            EnsureValidCondition(condition);
            query = query.Where(item => item.Condition == condition);
        }

        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);

        return items.Select(MapInventory).ToList();
    }

    public async Task<InventoryResponse> GetByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        return MapInventory(item);
    }

    public async Task<IReadOnlyList<InventoryResponse>> GetByProductAsync(
        int productId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(product => product.Shop)
            .FirstOrDefaultAsync(product => product.Id == productId, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var items = await InventoryQuery()
            .Where(item => item.ProductVariant.ProductId == productId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);

        return items.Select(MapInventory).ToList();
    }

    public async Task<InventoryResponse> CreateAsync(
        int productId,
        int variantId,
        InventoryCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var productExists = await _dbContext.Products
            .AsNoTracking()
            .AnyAsync(product => product.Id == productId, cancellationToken);

        if (!productExists)
        {
            throw ProductNotFound();
        }

        var variant = await _dbContext.ProductVariants
            .Include(v => v.Product)
                .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);

        if (variant == null)
        {
            throw VariantNotFound();
        }

        if (variant.ProductId != productId)
        {
            throw ProductVariantMismatch();
        }

        if (variant.Product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(variant.Product, currentUserId, currentUserRole);

        var assetCode = NormalizeRequired(request.AssetCode);
        var condition = NormalizeCondition(request.Condition);
        EnsureValidCondition(condition);
        await EnsureUniqueAssetCodeAsync(assetCode, null, cancellationToken);

        var item = new ProductInventoryItem
        {
            ProductVariantId = variant.Id,
            AssetCode = assetCode,
            Condition = condition,
            Status = AvailableStatus,
            Notes = NormalizeOptional(request.Notes),
            AcquiredAt = request.AcquiredAt,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProductInventoryItems.Add(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<InventoryResponse> UpdateAsync(
        int id,
        InventoryUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var assetCode = NormalizeRequired(request.AssetCode);
        var condition = NormalizeCondition(request.Condition);
        EnsureValidCondition(condition);
        await EnsureUniqueAssetCodeAsync(assetCode, item.Id, cancellationToken);

        item.AssetCode = assetCode;
        item.Condition = condition;
        item.Notes = NormalizeOptional(request.Notes);
        item.AcquiredAt = request.AcquiredAt;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<InventoryResponse> UpdateStatusAsync(
        int id,
        InventoryStatusRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var status = NormalizeStatus(request.Status);
        EnsureValidStatus(status);

        item.Status = status;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            return false;
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var hasRentalHistory = await _dbContext.RentalReservations
            .AnyAsync(reservation => reservation.ProductInventoryItemId == item.Id, cancellationToken);

        if (hasRentalHistory)
        {
            throw new ApiException(
                ErrorCodes.InventoryHasRentalHistory,
                "Inventory item has rental history and cannot be deleted. Retire it instead.",
                StatusCodes.Status409Conflict);
        }

        _dbContext.ProductInventoryItems.Remove(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private IQueryable<ProductInventoryItem> InventoryQuery()
    {
        return _dbContext.ProductInventoryItems
            .AsNoTracking()
            .Include(item => item.ProductVariant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Shop);
    }

    private IQueryable<ProductInventoryItem> InventoryForManagementQuery()
    {
        return _dbContext.ProductInventoryItems
            .Include(item => item.ProductVariant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Shop);
    }

    private static InventoryResponse MapInventory(ProductInventoryItem item)
    {
        return new InventoryResponse
        {
            Id = item.Id,
            ProductId = item.ProductVariant.ProductId,
            ProductName = item.ProductVariant.Product.Name,
            ProductVariantId = item.ProductVariantId,
            Size = item.ProductVariant.Size,
            Color = item.ProductVariant.Color,
            VariantCode = item.ProductVariant.VariantCode,
            AssetCode = item.AssetCode,
            Condition = item.Condition,
            Status = item.Status,
            Notes = item.Notes,
            AcquiredAt = item.AcquiredAt,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static IQueryable<ProductInventoryItem> ApplyManagementScope(
        IQueryable<ProductInventoryItem> query,
        int currentUserId,
        string currentUserRole)
    {
        if (string.Equals(currentUserRole, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return query;
        }

        if (string.Equals(currentUserRole, LenderRole, StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(item => item.ProductVariant.Product.Shop != null
                && item.ProductVariant.Product.Shop.OwnerUserId == currentUserId);
        }

        throw new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to view inventory.",
            StatusCodes.Status403Forbidden);
    }

    private async Task EnsureUniqueAssetCodeAsync(
        string assetCode,
        int? currentInventoryItemId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.ProductInventoryItems
            .AnyAsync(
                item => item.AssetCode == assetCode
                    && (!currentInventoryItemId.HasValue || item.Id != currentInventoryItemId.Value),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                ErrorCodes.DuplicateAssetCode,
                "AssetCode already exists.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static void EnsureCanManageProduct(
        Product product,
        int currentUserId,
        string currentUserRole)
    {
        if (string.Equals(currentUserRole, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.Equals(currentUserRole, LenderRole, StringComparison.OrdinalIgnoreCase)
            && product.Shop?.OwnerUserId == currentUserId)
        {
            return;
        }

        throw new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to manage this inventory item.",
            StatusCodes.Status403Forbidden);
    }

    private static void EnsureValidCondition(string condition)
    {
        if (!ValidConditions.Contains(condition, StringComparer.OrdinalIgnoreCase))
        {
            throw new ApiException(
                ErrorCodes.InvalidInventoryCondition,
                "Inventory condition is not supported.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static void EnsureValidStatus(string status)
    {
        if (!ValidStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
        {
            throw new ApiException(
                ErrorCodes.InvalidInventoryStatus,
                "Inventory status is not supported.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static string NormalizeRequired(string value)
    {
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ApiException(
                ErrorCodes.ValidationError,
                "Required inventory value cannot be empty.",
                StatusCodes.Status400BadRequest);
        }

        return trimmed;
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string NormalizeCondition(string condition)
    {
        return NormalizeRequired(condition).ToUpperInvariant();
    }

    private static string NormalizeStatus(string status)
    {
        return NormalizeRequired(status).ToUpperInvariant();
    }

    private static ApiException InventoryNotFound()
    {
        return new ApiException(
            ErrorCodes.InventoryItemNotFound,
            "Inventory item not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException ProductNotFound()
    {
        return new ApiException(
            ErrorCodes.ProductNotFound,
            "Product not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException VariantNotFound()
    {
        return new ApiException(
            ErrorCodes.VariantNotFound,
            "Product variant not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException ProductVariantMismatch()
    {
        return new ApiException(
            ErrorCodes.ProductVariantMismatch,
            "Product variant does not belong to the specified product.",
            StatusCodes.Status400BadRequest);
    }
}
