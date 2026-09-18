using System.Data;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Refund;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class RefundService : IRefundService
{
    private static readonly string[] RefundTypes = ["deposit", "order_cancel"];
    private static readonly string[] RefundStatuses = ["pending", "processing", "completed", "rejected", "cancelled"];
    private static readonly IReadOnlyDictionary<string, string[]> StatusTransitions =
        new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase)
        {
            ["pending"] = ["processing", "completed", "rejected", "cancelled"],
            ["processing"] = ["completed", "rejected", "cancelled"],
            ["completed"] = [],
            ["rejected"] = [],
            ["cancelled"] = []
        };

    private readonly DoRentMeDbContext _dbContext;
    private readonly IReturnInspectionService _returnInspectionService;

    public RefundService(DoRentMeDbContext dbContext, IReturnInspectionService returnInspectionService)
    {
        _dbContext = dbContext;
        _returnInspectionService = returnInspectionService;
    }

    public async Task CreateOrderCancellationRefundIfRequiredAsync(int orderId, int requestedByUserId, CancellationToken cancellationToken = default)
    {
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(item => item.OrderId == orderId, cancellationToken);
        if (payment?.Status != "paid")
        {
            return;
        }

        var exists = await _dbContext.Refunds.AnyAsync(item =>
            item.OrderId == orderId && item.PaymentId == payment.Id && item.Type == "order_cancel", cancellationToken);
        if (exists)
        {
            return;
        }

        _dbContext.Refunds.Add(new Refund
        {
            OrderId = orderId,
            PaymentId = payment.Id,
            Type = "order_cancel",
            Status = "pending",
            Amount = payment.Amount,
            RequestedByUserId = requestedByUserId,
            RequestedAt = DateTime.UtcNow
        });
    }

    public async Task<RefundResponse> CreateDepositSettlementAsync(
        int adminUserId,
        int orderId,
        DepositSettlementRequest request,
        CancellationToken cancellationToken = default)
    {
        var relational = _dbContext.Database.IsRelational();
        await using var transaction = relational
            ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
            : null;

        var order = await _dbContext.Orders.FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order == null)
        {
            throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        }

        if (order.Status != "returned" || order.TotalDeposit <= 0)
        {
            throw BusinessError(ErrorCodes.OrderNotEligibleForDepositSettlement, "Order is not eligible for deposit settlement.");
        }

        var payment = await _dbContext.Payments.FirstOrDefaultAsync(item => item.OrderId == orderId, cancellationToken);
        if (payment == null)
        {
            throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        }

        if (payment.Status != "paid")
        {
            throw BusinessError(ErrorCodes.PaymentNotPaid, "The order payment must be paid before deposit settlement.");
        }

        var inspectionSummary = await _returnInspectionService.GetSummaryAsync(orderId, requireComplete: true, cancellationToken: cancellationToken);

        var amount = decimal.Round(request.RefundAmount, 2, MidpointRounding.ToEven);
        if (amount < 0 || amount > order.TotalDeposit)
        {
            throw BusinessError(ErrorCodes.InvalidRefundAmount, "Refund amount must be between zero and the stored deposit.");
        }

        var reason = NormalizeOptional(request.Reason);
        if (amount < order.TotalDeposit && reason == null)
        {
            throw BusinessError(ErrorCodes.InvalidRefundAmount, "A reason is required when the refundable deposit is less than the stored deposit.");
        }

        if (amount != inspectionSummary.RecommendedRefund && reason == null)
        {
            throw BusinessError(ErrorCodes.InvalidRefundAmount, "A reason is required when the settlement differs from the inspection recommendation.");
        }

        var existing = await _dbContext.Refunds.AnyAsync(item =>
            item.OrderId == orderId && item.Type == "deposit" && item.Status != "rejected" && item.Status != "cancelled", cancellationToken);
        if (existing)
        {
            throw Conflict(ErrorCodes.DepositSettlementAlreadyExists, "A deposit settlement already exists for this order.");
        }

        var refund = new Refund
        {
            OrderId = orderId,
            PaymentId = payment.Id,
            Type = "deposit",
            Status = "pending",
            Amount = amount,
            Reason = reason,
            RequestedByUserId = adminUserId,
            RequestedAt = DateTime.UtcNow
        };
        _dbContext.Refunds.Add(refund);
        await _dbContext.SaveChangesAsync(cancellationToken);
        if (transaction != null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return MapRefund(refund);
    }

    public async Task<IReadOnlyList<RefundResponse>> GetCustomerRefundsAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var ownsOrder = await _dbContext.Orders.AnyAsync(item => item.Id == orderId && item.UserId == userId, cancellationToken);
        if (!ownsOrder)
        {
            throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        }

        var refunds = await RefundQuery()
            .Where(item => item.OrderId == orderId && item.Order.UserId == userId)
            .OrderByDescending(item => item.RequestedAt)
            .ToListAsync(cancellationToken);
        return refunds.Select(MapRefund).ToList();
    }

    public async Task<IReadOnlyList<RefundResponse>> GetAdminRefundsAsync(RefundFilters filters, CancellationToken cancellationToken = default)
    {
        var query = RefundQuery();
        if (!string.IsNullOrWhiteSpace(filters.Status)) query = query.Where(item => item.Status == filters.Status.Trim().ToLowerInvariant());
        if (!string.IsNullOrWhiteSpace(filters.Type)) query = query.Where(item => item.Type == filters.Type.Trim().ToLowerInvariant());
        if (filters.OrderId.HasValue) query = query.Where(item => item.OrderId == filters.OrderId.Value);
        var refunds = await query.OrderByDescending(item => item.RequestedAt).ThenByDescending(item => item.Id).ToListAsync(cancellationToken);
        return refunds.Select(MapRefund).ToList();
    }

    public async Task<RefundResponse> GetAdminRefundAsync(int refundId, CancellationToken cancellationToken = default)
    {
        var refund = await RefundQuery().FirstOrDefaultAsync(item => item.Id == refundId, cancellationToken);
        if (refund == null) throw NotFound(ErrorCodes.RefundNotFound, "Refund not found.");
        return MapRefund(refund);
    }

    public async Task<RefundResponse> UpdateStatusAsync(int adminUserId, int refundId, RefundStatusUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var target = NormalizeStatus(request.Status);
        if (!RefundStatuses.Contains(target, StringComparer.Ordinal)) throw BusinessError(ErrorCodes.InvalidRefundStatus, "Refund status is not supported.");

        var relational = _dbContext.Database.IsRelational();
        await using var transaction = relational
            ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken)
            : null;
        var refund = await _dbContext.Refunds.Include(item => item.Payment).FirstOrDefaultAsync(item => item.Id == refundId, cancellationToken);
        if (refund == null) throw NotFound(ErrorCodes.RefundNotFound, "Refund not found.");
        if (!StatusTransitions.TryGetValue(refund.Status, out var allowed) || !allowed.Contains(target, StringComparer.OrdinalIgnoreCase))
            throw Conflict(ErrorCodes.InvalidRefundTransition, "Refund status transition is not allowed.");

        refund.Status = target;
        refund.ProcessedByUserId = adminUserId;
        refund.TransactionCode = NormalizeOptional(request.TransactionCode) ?? refund.TransactionCode;
        if (target == "completed" || target == "rejected" || target == "cancelled") refund.ProcessedAt = DateTime.UtcNow;

        if (target == "completed" && refund.Type == "order_cancel" && refund.Payment != null && refund.Amount == refund.Payment.Amount)
        {
            refund.Payment.Status = "refunded";
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        if (transaction != null) await transaction.CommitAsync(cancellationToken);
        return MapRefund(await RefundQuery().FirstAsync(item => item.Id == refundId, cancellationToken));
    }

    private IQueryable<Refund> RefundQuery() => _dbContext.Refunds.AsNoTracking().Include(item => item.Order);
    private static RefundResponse MapRefund(Refund refund) => new() { Id = refund.Id, OrderId = refund.OrderId, PaymentId = refund.PaymentId, Type = refund.Type, Status = refund.Status, Amount = refund.Amount, Reason = refund.Reason, TransactionCode = refund.TransactionCode, RequestedAt = refund.RequestedAt, ProcessedAt = refund.ProcessedAt };
    private static string NormalizeStatus(string value) => value.Trim().ToLowerInvariant();
    private static string? NormalizeOptional(string? value) { var trimmed = value?.Trim(); return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed; }
    private static ApiException NotFound(string code, string message) => new(code, message, StatusCodes.Status404NotFound);
    private static ApiException BusinessError(string code, string message) => new(code, message, StatusCodes.Status400BadRequest);
    private static ApiException Conflict(string code, string message) => new(code, message, StatusCodes.Status409Conflict);
}
