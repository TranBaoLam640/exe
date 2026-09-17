using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class PaymentService : IPaymentService
{
    private static readonly string[] V1Statuses = ["pending", "paid", "failed", "cancelled"];
    private readonly DoRentMeDbContext _dbContext;

    public PaymentService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreatePendingPaymentAsync(Order order, CancellationToken cancellationToken = default)
    {
        if (await _dbContext.Payments.AnyAsync(payment => payment.OrderId == order.Id, cancellationToken))
        {
            throw BusinessError(ErrorCodes.PaymentAlreadyExists, "A payment already exists for this order.");
        }

        var shop = order.ShopId.HasValue
            ? await _dbContext.Shops.AsNoTracking().FirstOrDefaultAsync(shop => shop.Id == order.ShopId.Value, cancellationToken)
            : null;

        _dbContext.Payments.Add(new Payment
        {
            OrderId = order.Id,
            Method = "bank_transfer",
            Status = "pending",
            Amount = order.TotalRent + order.TotalDeposit - order.TotalDiscount,
            BankName = shop?.BankName,
            BankAccountNo = shop?.BankAccountNo,
            BankAccountName = shop?.BankAccountName,
            TransferContent = $"DORENTME {order.OrderCode}",
            CreatedAt = DateTime.UtcNow
        });
    }

    public async Task<PaymentResponse> GetCustomerPaymentAsync(
        int userId,
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var payment = await PaymentQuery()
            .FirstOrDefaultAsync(payment => payment.OrderId == orderId && payment.Order.UserId == userId, cancellationToken);

        if (payment == null)
        {
            throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        }

        return MapPayment(payment);
    }

    public async Task<PaymentResponse> GetAdminPaymentAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var payment = await PaymentQuery()
            .FirstOrDefaultAsync(payment => payment.OrderId == orderId, cancellationToken);

        if (payment == null)
        {
            throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        }

        return MapPayment(payment);
    }

    public async Task<PaymentResponse> UpdateStatusAsync(
        int adminUserId,
        int paymentId,
        PaymentStatusUpdateRequest request,
        CancellationToken cancellationToken = default)
    {
        var targetStatus = NormalizeStatus(request.Status);
        if (!V1Statuses.Contains(targetStatus, StringComparer.Ordinal))
        {
            throw BusinessError(ErrorCodes.InvalidPaymentStatus, "Payment status is not supported in Payment V1.");
        }

        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(payment => payment.Id == paymentId, cancellationToken);
        if (payment == null)
        {
            throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        }

        if (payment.Status != "pending" || targetStatus == "pending")
        {
            throw Conflict(ErrorCodes.InvalidPaymentTransition, "Payment status transition is not allowed.");
        }

        payment.Status = targetStatus;
        payment.ConfirmedByUserId = adminUserId;
        payment.ConfirmedAt = DateTime.UtcNow;
        payment.TransactionCode = NormalizeOptional(request.TransactionCode);
        if (targetStatus == "paid")
        {
            payment.PaidAt = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapPayment(await PaymentQuery().FirstAsync(item => item.Id == payment.Id, cancellationToken));
    }

    public async Task CancelPendingPaymentAsync(
        int orderId,
        CancellationToken cancellationToken = default)
    {
        var payment = await _dbContext.Payments
            .FirstOrDefaultAsync(item => item.OrderId == orderId, cancellationToken);
        if (payment?.Status == "pending")
        {
            payment.Status = "cancelled";
        }
    }

    private IQueryable<Payment> PaymentQuery()
    {
        return _dbContext.Payments
            .AsNoTracking()
            .Include(payment => payment.Order);
    }

    private static PaymentResponse MapPayment(Payment payment)
    {
        return new PaymentResponse
        {
            Id = payment.Id,
            OrderId = payment.OrderId,
            Method = payment.Method,
            Status = payment.Status,
            Amount = payment.Amount,
            RentalAmount = payment.Order.TotalRent,
            DepositAmount = payment.Order.TotalDeposit,
            DiscountAmount = payment.Order.TotalDiscount,
            BankName = payment.BankName,
            BankAccountNo = payment.BankAccountNo,
            BankAccountName = payment.BankAccountName,
            TransferContent = payment.TransferContent,
            TransactionCode = payment.TransactionCode,
            ProviderTransactionId = payment.ProviderTransactionId,
            PaidAt = payment.PaidAt,
            ConfirmedAt = payment.ConfirmedAt,
            CreatedAt = payment.CreatedAt
        };
    }

    private static string NormalizeStatus(string value) => value.Trim().ToLowerInvariant();

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static ApiException NotFound(string code, string message) =>
        new(code, message, StatusCodes.Status404NotFound);

    private static ApiException BusinessError(string code, string message) =>
        new(code, message, StatusCodes.Status400BadRequest);

    private static ApiException Conflict(string code, string message) =>
        new(code, message, StatusCodes.Status409Conflict);
}
