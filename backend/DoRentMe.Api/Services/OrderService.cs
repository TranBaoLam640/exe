using System.Data;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Order;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace DoRentMe.Api.Services;

public class OrderService : IOrderService
{
    private const string ActiveCartStatus = "active";
    private const string OrderedCartStatus = "ordered";
    private const string AvailableInventoryStatus = "AVAILABLE";
    private const string InitialOrderStatus = "pending_confirmation";
    private const string CancelledOrderStatus = "cancelled";
    private const string ReservedReservationStatus = "RESERVED";
    private const string ActiveReservationStatus = "ACTIVE";
    private const string CancelledReservationStatus = "CANCELLED";
    private const string AdminRole = "ADMIN";
    private const string LenderRole = "LENDER";

    private static readonly string[] BlockingReservationStatuses = [ReservedReservationStatus, ActiveReservationStatus];
    private static readonly SemaphoreSlim NonRelationalCheckoutLock = new(1, 1);
    private static readonly IReadOnlyDictionary<string, string[]> StatusTransitions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            [InitialOrderStatus] = ["shipping", CancelledOrderStatus],
            ["shipping"] = ["delivered"],
            ["delivered"] = ["return_requested"],
            ["return_requested"] = ["return_processing"],
            ["return_processing"] = ["returned"],
            ["returned"] = [],
            [CancelledOrderStatus] = []
        };

    private readonly DoRentMeDbContext _dbContext;

    public OrderService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CheckoutResponse> CheckoutAsync(
        int userId,
        CheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var relational = _dbContext.Database.IsRelational();
        if (!relational)
        {
            await NonRelationalCheckoutLock.WaitAsync(cancellationToken);
        }

        await using var transaction = relational
            ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
            : null;

        try
        {
            var checkout = await CheckoutCoreAsync(userId, request, relational, cancellationToken);

            if (transaction != null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return checkout;
        }
        catch
        {
            if (transaction != null)
            {
                await transaction.RollbackAsync(cancellationToken);
            }

            throw;
        }
        finally
        {
            if (!relational)
            {
                NonRelationalCheckoutLock.Release();
            }
        }
    }

    public async Task<IReadOnlyList<OrderResponse>> GetCustomerOrdersAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        var orders = await OrdersForResponse()
            .Where(order => order.UserId == userId)
            .OrderByDescending(order => order.CreatedAt)
            .ToListAsync(cancellationToken);

        return orders.Select(MapOrder).ToList();
    }

    public async Task<OrderResponse> GetCustomerOrderAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var order = await OrdersForResponse()
            .FirstOrDefaultAsync(order => order.Id == orderId && order.UserId == userId, cancellationToken);

        if (order == null)
        {
            throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        }

        return MapOrder(order);
    }

    public async Task<OrderResponse> CancelAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var relational = _dbContext.Database.IsRelational();
        await using var transaction = relational
            ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
            : null;

        var order = await _dbContext.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId, cancellationToken);

        if (order == null)
        {
            throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        }

        if (!CanTransition(order.Status, CancelledOrderStatus))
        {
            throw BusinessError(ErrorCodes.OrderCannotBeCancelled, "Order cannot be cancelled in its current status.");
        }

        await ApplyStatusAsync(order, CancelledOrderStatus, userId, "Customer cancelled order.", cancellationToken);

        var orderItemIds = order.Items.Select(item => item.Id).ToArray();
        var reservations = await _dbContext.RentalReservations
            .Where(reservation => orderItemIds.Contains(reservation.OrderItemId)
                && reservation.Status == ReservedReservationStatus)
            .ToListAsync(cancellationToken);

        foreach (var reservation in reservations)
        {
            reservation.Status = CancelledReservationStatus;
            reservation.UpdatedAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        if (transaction != null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return await GetCustomerOrderAsync(userId, order.Id, cancellationToken);
    }

    public async Task<OrderResponse> UpdateStatusAsync(
        int userId,
        string role,
        int orderId,
        OrderStatusUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var relational = _dbContext.Database.IsRelational();
        await using var transaction = relational
            ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
            : null;

        var targetStatus = NormalizeStatus(request.Status);
        if (!StatusTransitions.ContainsKey(targetStatus))
        {
            throw BusinessError(ErrorCodes.InvalidOrderStatus, "Order status is not supported.");
        }

        var order = await _dbContext.Orders
            .Include(o => o.Shop)
            .FirstOrDefaultAsync(o => o.Id == orderId, cancellationToken);

        if (order == null)
        {
            throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        }

        EnsureCanManageOrder(order, userId, role);

        if (!CanTransition(order.Status, targetStatus))
        {
            throw Conflict(ErrorCodes.InvalidOrderStatusTransition, "Order status transition is not allowed.");
        }

        await ApplyStatusAsync(order, targetStatus, userId, request.Note, cancellationToken);
        await _dbContext.SaveChangesAsync(cancellationToken);

        if (transaction != null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return MapOrder(await OrdersForResponse().FirstAsync(o => o.Id == order.Id, cancellationToken));
    }

    private async Task<CheckoutResponse> CheckoutCoreAsync(
        int userId,
        CheckoutRequest request,
        bool relational,
        CancellationToken cancellationToken)
    {
        var cart = await _dbContext.Carts
            .Include(c => c.Items)
                .ThenInclude(i => i.ProductVariant)
                    .ThenInclude(v => v.Product)
                        .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(c => c.UserId == userId && c.Status == ActiveCartStatus, cancellationToken);

        if (cart == null || cart.Items.Count == 0)
        {
            throw BusinessError(ErrorCodes.EmptyCart, "Cart is empty.");
        }

        var user = await _dbContext.Users
            .AsNoTracking()
            .FirstAsync(u => u.Id == userId, cancellationToken);

        var cartItems = cart.Items
            .OrderBy(item => item.CreatedAt)
            .ThenBy(item => item.Id)
            .ToList();

        foreach (var item in cartItems)
        {
            ValidateCartItem(item);
        }

        var cartSubtotal = cartItems.Sum(item =>
        {
            var product = item.ProductVariant.Product;
            var days = RentalPricingCalculator.CalculateRentalDays(item.RentalStartDate, item.RentalEndDate);
            return RentalPricingCalculator.CalculateRentalPrice(product, days) * item.Quantity;
        });

        var discount = await ValidateVoucherAsync(
            userId,
            request.VoucherCode,
            cartSubtotal,
            relational,
            cancellationToken);

        var discountPlan = BuildDiscountPlan(cartItems, discount.Amount);
        var assignedReservations = new List<ReservationAssignment>();
        var createdOrders = new List<Order>();

        foreach (var group in cartItems.GroupBy(item => item.ProductVariant.Product.ShopId!.Value))
        {
            var groupItems = group.ToList();
            var now = DateTime.UtcNow;
            var order = new Order
            {
                OrderCode = $"DRM-{now:yyyyMMddHHmmss}-{Guid.NewGuid().ToString("N")[..8]}",
                ShopId = group.Key,
                UserId = userId,
                CustomerName = request.CustomerName.Trim(),
                CustomerPhone = request.CustomerPhone.Trim(),
                CustomerEmail = string.IsNullOrWhiteSpace(request.CustomerEmail) ? user.Email : request.CustomerEmail.Trim(),
                ShippingAddress = request.ShippingAddress.Trim(),
                CustomerNote = string.IsNullOrWhiteSpace(request.CustomerNote) ? null : request.CustomerNote.Trim(),
                Status = InitialOrderStatus,
                StartDate = groupItems.Min(item => item.RentalStartDate),
                EndDate = groupItems.Max(item => item.RentalEndDate),
                CreatedAt = now
            };

            foreach (var cartItem in groupItems)
            {
                var product = cartItem.ProductVariant.Product;
                var rentalDays = RentalPricingCalculator.CalculateRentalDays(cartItem.RentalStartDate, cartItem.RentalEndDate);
                var pricePerItem = RentalPricingCalculator.CalculateRentalPrice(product, rentalDays);
                var depositPerItem = product.PriceDeposit;
                var orderItem = new OrderItem
                {
                    ProductId = product.Id,
                    ProductVariantId = cartItem.ProductVariantId,
                    ProductNameSnapshot = product.Name,
                    SizeSnapshot = cartItem.ProductVariant.Size,
                    ColorSnapshot = cartItem.ProductVariant.Color,
                    Quantity = cartItem.Quantity,
                    RentalStartDate = cartItem.RentalStartDate,
                    RentalEndDate = cartItem.RentalEndDate,
                    RentalDays = rentalDays,
                    PricePerItem = pricePerItem,
                    DepositPerItem = depositPerItem,
                    LineSubtotal = pricePerItem * cartItem.Quantity,
                    DepositSubtotal = depositPerItem * cartItem.Quantity,
                    CreatedAt = now
                };

                var inventoryItems = await SelectInventoryItemsAsync(
                    cartItem.ProductVariantId,
                    cartItem.RentalStartDate,
                    cartItem.RentalEndDate,
                    cartItem.Quantity,
                    assignedReservations,
                    relational,
                    cancellationToken);

                foreach (var inventoryItem in inventoryItems)
                {
                    assignedReservations.Add(new ReservationAssignment(
                        inventoryItem.Id,
                        cartItem.RentalStartDate,
                        cartItem.RentalEndDate,
                        orderItem));
                }

                order.Items.Add(orderItem);
            }

            order.TotalRent = order.Items.Sum(item => item.LineSubtotal);
            order.TotalDeposit = order.Items.Sum(item => item.DepositSubtotal);
            order.TotalDiscount = discountPlan.GetValueOrDefault(group.Key);
            _dbContext.Orders.Add(order);
            createdOrders.Add(order);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var order in createdOrders)
        {
            _dbContext.OrderStatusHistory.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = null,
                NewStatus = InitialOrderStatus,
                Note = "Order created from checkout.",
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow
            });
        }

        foreach (var assignment in assignedReservations)
        {
            _dbContext.RentalReservations.Add(new RentalReservation
            {
                OrderItemId = assignment.OrderItem.Id,
                ProductInventoryItemId = assignment.InventoryItemId,
                StartDate = assignment.StartDate,
                EndDate = assignment.EndDate,
                Status = ReservedReservationStatus,
                CreatedAt = DateTime.UtcNow
            });
        }

        if (discount.Voucher != null)
        {
            discount.Voucher.UsedCount += 1;
            discount.Voucher.UpdatedAt = DateTime.UtcNow;

            if (discount.UserVoucher != null)
            {
                discount.UserVoucher.Status = "used";
                discount.UserVoucher.UsedAt = DateTime.UtcNow;
            }
        }

        cart.Status = OrderedCartStatus;
        cart.UpdatedAt = DateTime.UtcNow;
        _dbContext.CartItems.RemoveRange(cart.Items);

        await _dbContext.SaveChangesAsync(cancellationToken);

        var orderIds = createdOrders.Select(order => order.Id).ToArray();
        var responseOrders = await OrdersForResponse()
            .Where(order => orderIds.Contains(order.Id))
            .OrderBy(order => order.Id)
            .ToListAsync(cancellationToken);

        return new CheckoutResponse
        {
            Orders = responseOrders.Select(MapOrder).ToList()
        };
    }

    private async Task<IReadOnlyList<ProductInventoryItem>> SelectInventoryItemsAsync(
        int productVariantId,
        DateOnly rentalStartDate,
        DateOnly rentalEndDate,
        int quantity,
        IReadOnlyList<ReservationAssignment> pendingAssignments,
        bool relational,
        CancellationToken cancellationToken)
    {
        var candidates = await LockCandidateInventoryAsync(productVariantId, relational, cancellationToken);
        var candidateIds = candidates.Select(item => item.Id).ToArray();
        var blockedIds = await _dbContext.RentalReservations
            .AsNoTracking()
            .Where(reservation => candidateIds.Contains(reservation.ProductInventoryItemId)
                && BlockingReservationStatuses.Contains(reservation.Status)
                && reservation.StartDate < rentalEndDate
                && reservation.EndDate > rentalStartDate)
            .Select(reservation => reservation.ProductInventoryItemId)
            .ToListAsync(cancellationToken);

        var blocked = blockedIds.ToHashSet();
        foreach (var pending in pendingAssignments)
        {
            if (pending.StartDate < rentalEndDate && pending.EndDate > rentalStartDate)
            {
                blocked.Add(pending.InventoryItemId);
            }
        }

        var selected = candidates
            .Where(item => !blocked.Contains(item.Id))
            .OrderBy(item => item.Id)
            .Take(quantity)
            .ToList();

        if (selected.Count < quantity)
        {
            throw Conflict(ErrorCodes.RentalInventoryConflict, "Not enough inventory is available for this rental period.");
        }

        return selected;
    }

    private async Task<List<ProductInventoryItem>> LockCandidateInventoryAsync(
        int productVariantId,
        bool relational,
        CancellationToken cancellationToken)
    {
        if (relational && IsMySqlProvider())
        {
            return await _dbContext.ProductInventoryItems
                .FromSqlInterpolated($"""
                    SELECT *
                    FROM ProductInventoryItems
                    WHERE ProductVariantId = {productVariantId}
                      AND Status = {AvailableInventoryStatus}
                    ORDER BY Id
                    FOR UPDATE
                    """)
                .ToListAsync(cancellationToken);
        }

        return await _dbContext.ProductInventoryItems
            .Where(item => item.ProductVariantId == productVariantId
                && item.Status == AvailableInventoryStatus)
            .OrderBy(item => item.Id)
            .ToListAsync(cancellationToken);
    }

    private async Task<(Voucher? Voucher, UserVoucher? UserVoucher, decimal Amount)> ValidateVoucherAsync(
        int userId,
        string? voucherCode,
        decimal subtotal,
        bool relational,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(voucherCode))
        {
            return (null, null, 0);
        }

        var code = voucherCode.Trim();
        var voucher = relational && IsMySqlProvider()
            ? await _dbContext.Vouchers
                .FromSqlInterpolated($"SELECT * FROM Vouchers WHERE Code = {code} FOR UPDATE")
                .FirstOrDefaultAsync(cancellationToken)
            : await _dbContext.Vouchers.FirstOrDefaultAsync(v => v.Code == code, cancellationToken);

        var now = DateTime.UtcNow;
        if (voucher == null || !voucher.IsActive)
        {
            throw NotFound(ErrorCodes.VoucherNotFound, "Voucher not found.");
        }

        if ((voucher.StartAt.HasValue && voucher.StartAt.Value > now)
            || (voucher.EndAt.HasValue && voucher.EndAt.Value < now)
            || (voucher.UsageLimit.HasValue && voucher.UsedCount >= voucher.UsageLimit.Value)
            || (voucher.MinOrderAmount.HasValue && subtotal < voucher.MinOrderAmount.Value))
        {
            throw BusinessError(ErrorCodes.VoucherNotApplicable, "Voucher is not applicable.");
        }

        UserVoucher? userVoucher = null;
        var voucherHasUserAssignments = await _dbContext.UserVouchers
            .AnyAsync(uv => uv.VoucherId == voucher.Id, cancellationToken);

        if (voucherHasUserAssignments)
        {
            userVoucher = await _dbContext.UserVouchers
                .FirstOrDefaultAsync(uv => uv.VoucherId == voucher.Id
                    && uv.UserId == userId
                    && uv.Status == "available"
                    && (!uv.ExpiresAt.HasValue || uv.ExpiresAt.Value >= now),
                    cancellationToken);

            if (userVoucher == null)
            {
                throw BusinessError(ErrorCodes.VoucherNotApplicable, "Voucher is not available for this user.");
            }
        }

        return (voucher, userVoucher, CalculateDiscount(voucher, subtotal));
    }

    private static Dictionary<int, decimal> BuildDiscountPlan(
        IReadOnlyList<CartItem> cartItems,
        decimal discountAmount)
    {
        var groups = cartItems
            .GroupBy(item => item.ProductVariant.Product.ShopId!.Value)
            .Select(group => new
            {
                ShopId = group.Key,
                Subtotal = group.Sum(item =>
                {
                    var product = item.ProductVariant.Product;
                    var days = RentalPricingCalculator.CalculateRentalDays(item.RentalStartDate, item.RentalEndDate);
                    return RentalPricingCalculator.CalculateRentalPrice(product, days) * item.Quantity;
                })
            })
            .ToList();

        var plan = groups.ToDictionary(group => group.ShopId, _ => 0m);
        if (discountAmount <= 0 || groups.Count == 0)
        {
            return plan;
        }

        var totalSubtotal = groups.Sum(group => group.Subtotal);
        var allocated = 0m;
        for (var index = 0; index < groups.Count; index += 1)
        {
            var group = groups[index];
            var amount = index == groups.Count - 1
                ? discountAmount - allocated
                : Math.Round(discountAmount * group.Subtotal / totalSubtotal, 2);
            plan[group.ShopId] = amount;
            allocated += amount;
        }

        return plan;
    }

    private static void ValidateCartItem(CartItem item)
    {
        if (item.Quantity <= 0 || item.RentalStartDate == default || item.RentalEndDate == default || item.RentalStartDate >= item.RentalEndDate)
        {
            throw BusinessError(ErrorCodes.InvalidRentalPeriod, "RentalEndDate must be after RentalStartDate.");
        }

        var variant = item.ProductVariant;
        var product = variant.Product;
        if (!variant.IsActive)
        {
            throw BusinessError(ErrorCodes.VariantUnavailable, "Product variant is unavailable.");
        }

        if (!product.IsActive)
        {
            throw BusinessError(ErrorCodes.ProductUnavailable, "Product is unavailable.");
        }

        if (product.Shop == null || !product.Shop.IsActive || product.ShopId == null)
        {
            throw BusinessError(ErrorCodes.ProductUnavailable, "Product shop is unavailable.");
        }
    }

    private async Task ApplyStatusAsync(
        Order order,
        string newStatus,
        int changedByUserId,
        string? note,
        CancellationToken cancellationToken)
    {
        var oldStatus = order.Status;
        order.Status = newStatus;
        order.UpdatedAt = DateTime.UtcNow;
        order.DeliveryConfirmed = newStatus == "delivered" || order.DeliveryConfirmed;
        order.ReturnRequestedAt = newStatus == "return_requested" && order.ReturnRequestedAt == null
            ? DateTime.UtcNow
            : order.ReturnRequestedAt;

        _dbContext.OrderStatusHistory.Add(new OrderStatusHistory
        {
            OrderId = order.Id,
            OldStatus = oldStatus,
            NewStatus = newStatus,
            Note = note,
            CreatedByUserId = changedByUserId,
            CreatedAt = DateTime.UtcNow
        });

        if (newStatus == CancelledOrderStatus)
        {
            var orderItemIds = await _dbContext.OrderItems
                .Where(item => item.OrderId == order.Id)
                .Select(item => item.Id)
                .ToArrayAsync(cancellationToken);
            var reservations = await _dbContext.RentalReservations
                .Where(reservation => orderItemIds.Contains(reservation.OrderItemId)
                    && reservation.Status == ReservedReservationStatus)
                .ToListAsync(cancellationToken);
            foreach (var reservation in reservations)
            {
                reservation.Status = CancelledReservationStatus;
                reservation.UpdatedAt = DateTime.UtcNow;
            }
        }
    }

    private IQueryable<Order> OrdersForResponse()
    {
        return _dbContext.Orders
            .AsNoTracking()
            .Include(order => order.Shop)
            .Include(order => order.Items)
                .ThenInclude(item => item.Product)
                    .ThenInclude(product => product.Images)
            .Include(order => order.Items)
                .ThenInclude(item => item.ProductVariant)
            .Include(order => order.User)
            .Include(order => order.StatusHistory);
    }

    private static OrderResponse MapOrder(Order order)
    {
        return new OrderResponse
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            ShopId = order.ShopId,
            ShopName = order.Shop?.Name,
            Status = order.Status,
            Customer = new OrderCustomerResponse
            {
                Name = order.CustomerName,
                Phone = order.CustomerPhone,
                Email = order.CustomerEmail,
                Address = order.ShippingAddress,
                Note = order.CustomerNote
            },
            Items = order.Items
                .OrderBy(item => item.Id)
                .Select(item => new OrderItemResponse
                {
                    Id = item.Id,
                    ProductId = item.ProductId,
                    ProductVariantId = item.ProductVariantId,
                    Name = item.ProductNameSnapshot,
                    Size = item.SizeSnapshot,
                    Color = item.ColorSnapshot,
                    Image = item.Product.Images
                        .OrderByDescending(image => image.IsPrimary)
                        .ThenBy(image => image.SortOrder)
                        .FirstOrDefault()
                        ?.ImageUrl,
                    Quantity = item.Quantity,
                    RentalStartDate = item.RentalStartDate,
                    RentalEndDate = item.RentalEndDate,
                    RentalDays = item.RentalDays,
                    PricePerItem = item.PricePerItem,
                    DepositPerItem = item.DepositPerItem,
                    LineSubtotal = item.LineSubtotal,
                    DepositSubtotal = item.DepositSubtotal
                })
                .ToList(),
            Totals = new OrderTotalsResponse
            {
                Rent = order.TotalRent,
                Deposit = order.TotalDeposit,
                Discount = order.TotalDiscount,
                Total = order.TotalRent + order.TotalDeposit - order.TotalDiscount
            },
            StartDate = order.StartDate,
            EndDate = order.EndDate,
            DeliveryConfirmed = order.DeliveryConfirmed,
            ReturnRequestedAt = order.ReturnRequestedAt,
            CreatedAt = order.CreatedAt,
            History = order.StatusHistory
                .OrderBy(entry => entry.CreatedAt)
                .ThenBy(entry => entry.Id)
                .Select(entry => new OrderStatusHistoryResponse
                {
                    OldStatus = entry.OldStatus,
                    Status = entry.NewStatus,
                    Note = entry.Note,
                    CreatedByUserId = entry.CreatedByUserId,
                    At = entry.CreatedAt
                })
                .ToList()
        };
    }

    private static decimal CalculateDiscount(Voucher voucher, decimal subtotal)
    {
        var discount = voucher.DiscountType == "percent"
            ? subtotal * voucher.DiscountValue / 100m
            : voucher.DiscountValue;

        return Math.Min(subtotal, Math.Max(0, discount));
    }

    private static bool CanTransition(string currentStatus, string nextStatus)
    {
        return StatusTransitions.TryGetValue(currentStatus, out var nextStatuses)
            && nextStatuses.Contains(nextStatus, StringComparer.OrdinalIgnoreCase);
    }

    private static string NormalizeStatus(string status)
    {
        return status.Trim().ToLowerInvariant();
    }

    private static void EnsureCanManageOrder(Order order, int userId, string role)
    {
        if (string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.Equals(role, LenderRole, StringComparison.OrdinalIgnoreCase)
            && order.Shop?.OwnerUserId == userId)
        {
            return;
        }

        throw new ApiException(ErrorCodes.Forbidden, "You are not allowed to manage this order.", StatusCodes.Status403Forbidden);
    }

    private bool IsMySqlProvider()
    {
        return _dbContext.Database.ProviderName?.Contains("MySql", StringComparison.OrdinalIgnoreCase) == true;
    }

    private static ApiException NotFound(string code, string message)
    {
        return new ApiException(code, message, StatusCodes.Status404NotFound);
    }

    private static ApiException BusinessError(string code, string message)
    {
        return new ApiException(code, message, StatusCodes.Status400BadRequest);
    }

    private static ApiException Conflict(string code, string message)
    {
        return new ApiException(code, message, StatusCodes.Status409Conflict);
    }

    private sealed record ReservationAssignment(
        int InventoryItemId,
        DateOnly StartDate,
        DateOnly EndDate,
        OrderItem OrderItem);
}
