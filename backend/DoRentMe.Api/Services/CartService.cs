using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Cart;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class CartService : ICartService
{
    private const string ActiveCartStatus = "active";
    private const string AvailableInventoryStatus = "AVAILABLE";
    private static readonly string[] BlockingReservationStatuses = ["RESERVED", "ACTIVE"];

    private readonly DoRentMeDbContext _dbContext;

    public CartService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CartResponse> GetCurrentCartAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);
        return await BuildCartResponseAsync(cart.Id, null, cancellationToken);
    }

    public async Task<CartResponse> AddItemAsync(
        int userId,
        CartItemRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateRentalPeriod(request.RentalStartDate, request.RentalEndDate);
        var variant = await GetValidVariantAsync(request.ProductVariantId, cancellationToken);
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);

        var existing = await _dbContext.CartItems
            .FirstOrDefaultAsync(
                item => item.CartId == cart.Id
                    && item.ProductVariantId == request.ProductVariantId
                    && item.RentalStartDate == request.RentalStartDate
                    && item.RentalEndDate == request.RentalEndDate,
                cancellationToken);

        var nextQuantity = request.Quantity + (existing?.Quantity ?? 0);
        await EnsureStockAsync(
            cart.Id,
            variant.Id,
            request.RentalStartDate,
            request.RentalEndDate,
            nextQuantity,
            existing?.Id is null ? [] : [existing.Id],
            cancellationToken);

        if (existing == null)
        {
            _dbContext.CartItems.Add(new CartItem
            {
                CartId = cart.Id,
                ProductVariantId = variant.Id,
                Quantity = request.Quantity,
                RentalStartDate = request.RentalStartDate,
                RentalEndDate = request.RentalEndDate,
                CreatedAt = DateTime.UtcNow
            });
        }
        else
        {
            existing.Quantity = nextQuantity;
            existing.UpdatedAt = DateTime.UtcNow;
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(cart.Id, null, cancellationToken);
    }

    public async Task<CartResponse> UpdateItemAsync(
        int userId,
        int itemId,
        CartItemUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        ValidateRentalPeriod(request.RentalStartDate, request.RentalEndDate);
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);
        var item = await _dbContext.CartItems
            .Include(i => i.ProductVariant)
                .ThenInclude(v => v.Product)
                    .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(i => i.Id == itemId && i.CartId == cart.Id, cancellationToken);

        if (item == null)
        {
            throw NotFound("CART_ITEM_NOT_FOUND", "Cart item not found.");
        }

        EnsureVariantIsRentable(item.ProductVariant);

        var duplicate = await _dbContext.CartItems
            .FirstOrDefaultAsync(
                i => i.CartId == cart.Id
                    && i.Id != item.Id
                    && i.ProductVariantId == item.ProductVariantId
                    && i.RentalStartDate == request.RentalStartDate
                    && i.RentalEndDate == request.RentalEndDate,
                cancellationToken);

        var requestedQuantity = request.Quantity + (duplicate?.Quantity ?? 0);
        await EnsureStockAsync(
            cart.Id,
            item.ProductVariantId,
            request.RentalStartDate,
            request.RentalEndDate,
            requestedQuantity,
            duplicate == null ? [item.Id] : [item.Id, duplicate.Id],
            cancellationToken);

        if (duplicate == null)
        {
            item.Quantity = request.Quantity;
            item.RentalStartDate = request.RentalStartDate;
            item.RentalEndDate = request.RentalEndDate;
            item.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            duplicate.Quantity = requestedQuantity;
            duplicate.UpdatedAt = DateTime.UtcNow;
            _dbContext.CartItems.Remove(item);
        }

        cart.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(cart.Id, null, cancellationToken);
    }

    public async Task<CartResponse> RemoveItemAsync(
        int userId,
        int itemId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);
        var item = await _dbContext.CartItems
            .FirstOrDefaultAsync(i => i.Id == itemId && i.CartId == cart.Id, cancellationToken);

        if (item == null)
        {
            throw NotFound("CART_ITEM_NOT_FOUND", "Cart item not found.");
        }

        _dbContext.CartItems.Remove(item);
        cart.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(cart.Id, null, cancellationToken);
    }

    public async Task<CartResponse> ClearAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);
        var items = await _dbContext.CartItems
            .Where(i => i.CartId == cart.Id)
            .ToListAsync(cancellationToken);

        _dbContext.CartItems.RemoveRange(items);
        cart.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await BuildCartResponseAsync(cart.Id, null, cancellationToken);
    }

    public async Task<CartResponse> PreviewDiscountAsync(
        int userId,
        DiscountPreviewRequest request,
        CancellationToken cancellationToken = default)
    {
        var cart = await GetOrCreateCurrentCartAsync(userId, cancellationToken);
        var cartResponse = await BuildCartResponseAsync(cart.Id, null, cancellationToken);
        var code = request.Code.Trim();
        var now = DateTime.UtcNow;

        var voucher = await _dbContext.Vouchers
            .AsNoTracking()
            .FirstOrDefaultAsync(v => v.Code == code, cancellationToken);

        if (voucher == null || !voucher.IsActive)
        {
            throw NotFound("VOUCHER_NOT_FOUND", "Voucher not found.");
        }

        if ((voucher.StartAt.HasValue && voucher.StartAt.Value > now)
            || (voucher.EndAt.HasValue && voucher.EndAt.Value < now))
        {
            throw BusinessError("VOUCHER_NOT_APPLICABLE", "Voucher is not active for this time window.");
        }

        if (voucher.UsageLimit.HasValue && voucher.UsedCount >= voucher.UsageLimit.Value)
        {
            throw BusinessError("VOUCHER_NOT_APPLICABLE", "Voucher usage limit has been reached.");
        }

        if (voucher.MinOrderAmount.HasValue && cartResponse.Subtotal < voucher.MinOrderAmount.Value)
        {
            throw BusinessError("VOUCHER_NOT_APPLICABLE", "Cart subtotal does not meet voucher minimum.");
        }

        var voucherHasUserAssignments = await _dbContext.UserVouchers
            .AsNoTracking()
            .AnyAsync(uv => uv.VoucherId == voucher.Id, cancellationToken);

        if (voucherHasUserAssignments)
        {
            var hasAvailableVoucher = await _dbContext.UserVouchers
                .AsNoTracking()
                .AnyAsync(
                    uv => uv.VoucherId == voucher.Id
                        && uv.UserId == userId
                        && uv.Status == "available"
                        && (!uv.ExpiresAt.HasValue || uv.ExpiresAt.Value >= now),
                    cancellationToken);

            if (!hasAvailableVoucher)
            {
                throw BusinessError("VOUCHER_NOT_APPLICABLE", "Voucher is not available for this user.");
            }
        }

        var discountAmount = CalculateDiscount(voucher, cartResponse.Subtotal);
        var discount = new CartDiscountPreviewResponse
        {
            Code = voucher.Code,
            DiscountType = voucher.DiscountType,
            DiscountValue = voucher.DiscountValue,
            DiscountAmount = discountAmount,
            TotalAfterDiscount = cartResponse.Subtotal - discountAmount
        };

        return await BuildCartResponseAsync(cart.Id, discount, cancellationToken);
    }

    private async Task<Cart> GetOrCreateCurrentCartAsync(
        int userId,
        CancellationToken cancellationToken)
    {
        var cart = await _dbContext.Carts
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == ActiveCartStatus, cancellationToken);

        if (cart != null)
        {
            return cart;
        }

        cart = new Cart
        {
            UserId = userId,
            Status = ActiveCartStatus,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return cart;
    }

    private async Task<ProductVariant> GetValidVariantAsync(
        int productVariantId,
        CancellationToken cancellationToken)
    {
        var variant = await _dbContext.ProductVariants
            .Include(v => v.Product)
                .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(v => v.Id == productVariantId, cancellationToken);

        if (variant == null)
        {
            throw NotFound("VARIANT_NOT_FOUND", "Product variant not found.");
        }

        EnsureVariantIsRentable(variant);
        return variant;
    }

    private static void EnsureVariantIsRentable(ProductVariant variant)
    {
        if (!variant.IsActive)
        {
            throw BusinessError("VARIANT_UNAVAILABLE", "Product variant is unavailable.");
        }

        if (variant.Product == null || !variant.Product.IsActive)
        {
            throw BusinessError("PRODUCT_UNAVAILABLE", "Product is unavailable.");
        }

        if (variant.Product.Shop == null || !variant.Product.Shop.IsActive)
        {
            throw BusinessError("PRODUCT_UNAVAILABLE", "Product shop is unavailable.");
        }
    }

    private async Task EnsureStockAsync(
        int cartId,
        int productVariantId,
        DateOnly rentalStartDate,
        DateOnly rentalEndDate,
        int requestedQuantity,
        int[] excludedCartItemIds,
        CancellationToken cancellationToken)
    {
        var availableStock = await CountAvailableStockAsync(
            productVariantId,
            rentalStartDate,
            rentalEndDate,
            cancellationToken);
        var overlappingCartQuantity = await _dbContext.CartItems
            .AsNoTracking()
            .Where(item => item.CartId == cartId
                && item.ProductVariantId == productVariantId
                && !excludedCartItemIds.Contains(item.Id)
                && item.RentalStartDate < rentalEndDate
                && item.RentalEndDate > rentalStartDate)
            .SumAsync(item => item.Quantity, cancellationToken);

        if (requestedQuantity + overlappingCartQuantity > availableStock)
        {
            throw BusinessError("INSUFFICIENT_STOCK", "Not enough inventory is available for this rental period.");
        }
    }

    private async Task<int> CountAvailableStockAsync(
        int productVariantId,
        DateOnly rentalStartDate,
        DateOnly rentalEndDate,
        CancellationToken cancellationToken)
    {
        return await _dbContext.ProductInventoryItems
            .AsNoTracking()
            .Where(item => item.ProductVariantId == productVariantId
                && item.Status == AvailableInventoryStatus
                && !_dbContext.RentalReservations.Any(reservation =>
                    reservation.ProductInventoryItemId == item.Id
                    && BlockingReservationStatuses.Contains(reservation.Status)
                    && reservation.StartDate < rentalEndDate
                    && reservation.EndDate > rentalStartDate))
            .CountAsync(cancellationToken);
    }

    private async Task<CartResponse> BuildCartResponseAsync(
        int cartId,
        CartDiscountPreviewResponse? discount,
        CancellationToken cancellationToken)
    {
        var cart = await _dbContext.Carts
            .AsNoTracking()
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Shop)
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Images)
            .FirstAsync(c => c.Id == cartId, cancellationToken);

        var response = new CartResponse
        {
            Id = cart.Id,
            Status = cart.Status,
            Shipping = null
        };

        foreach (var item in cart.Items.OrderBy(i => i.CreatedAt).ThenBy(i => i.Id))
        {
            var product = item.ProductVariant.Product;
            var rentalDays = CalculateRentalDays(item.RentalStartDate, item.RentalEndDate);
            var rentalPrice = CalculateRentalPrice(product, rentalDays);
            var lineSubtotal = rentalPrice * item.Quantity;
            var deposit = product.PriceDeposit * item.Quantity;
            var availableStock = await CountAvailableStockAsync(
                item.ProductVariantId,
                item.RentalStartDate,
                item.RentalEndDate,
                cancellationToken);

            response.Items.Add(new CartItemResponse
            {
                Id = item.Id,
                ProductId = product.Id,
                ProductName = product.Name,
                ProductSlug = product.Slug,
                VariantId = item.ProductVariantId,
                VariantCode = item.ProductVariant.VariantCode,
                Size = item.ProductVariant.Size,
                Color = item.ProductVariant.Color,
                Image = product.Images
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .FirstOrDefault()
                    ?.ImageUrl,
                Quantity = item.Quantity,
                RentalStartDate = item.RentalStartDate,
                RentalEndDate = item.RentalEndDate,
                RentalDays = rentalDays,
                AvailableStock = availableStock,
                RentalPrice = rentalPrice,
                LineSubtotal = lineSubtotal,
                Deposit = deposit
            });

            response.ItemCount += item.Quantity;
            response.Subtotal += lineSubtotal;
            response.DepositTotal += deposit;
        }

        response.Discount = discount;
        var discountAmount = discount?.DiscountAmount ?? 0;
        response.GrandTotalPreview = response.Subtotal + response.DepositTotal - discountAmount;

        return response;
    }

    private static int CalculateRentalDays(DateOnly rentalStartDate, DateOnly rentalEndDate)
    {
        return rentalEndDate.DayNumber - rentalStartDate.DayNumber;
    }

    private static void ValidateRentalPeriod(DateOnly rentalStartDate, DateOnly rentalEndDate)
    {
        if (rentalStartDate == default || rentalEndDate == default || rentalStartDate >= rentalEndDate)
        {
            throw BusinessError("INVALID_RENTAL_PERIOD", "RentalEndDate must be after RentalStartDate.");
        }
    }

    private static decimal CalculateRentalPrice(Product product, int rentalDays)
    {
        if (rentalDays <= 1)
        {
            return product.Price1Day;
        }

        if (rentalDays <= 3)
        {
            return product.Price3Day;
        }

        return product.Price3Day + (product.ExtraDayPrice * (rentalDays - 3));
    }

    private static decimal CalculateDiscount(Voucher voucher, decimal subtotal)
    {
        var discount = voucher.DiscountType == "percent"
            ? subtotal * voucher.DiscountValue / 100m
            : voucher.DiscountValue;

        return Math.Min(subtotal, Math.Max(0, discount));
    }

    private static ApiException NotFound(string code, string message)
    {
        return new ApiException(code, message, StatusCodes.Status404NotFound);
    }

    private static ApiException BusinessError(string code, string message)
    {
        return new ApiException(code, message, StatusCodes.Status400BadRequest);
    }
}
