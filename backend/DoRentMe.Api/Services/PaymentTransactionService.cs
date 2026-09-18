using System.Data;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace DoRentMe.Api.Services;

public class PaymentTransactionService : IPaymentTransactionService
{
    private static long _sequence;
    private static readonly string[] TerminalStatuses = ["paid", "failed", "cancelled", "expired"];
    private readonly DoRentMeDbContext _dbContext;
    private readonly IPaymentGateway _gateway;
    private readonly IOptions<PayOsOptions> _options;

    public PaymentTransactionService(DoRentMeDbContext dbContext, IPaymentGateway gateway, IOptions<PayOsOptions> options)
    {
        _dbContext = dbContext;
        _gateway = gateway;
        _options = options;
    }

    public async Task<PayOsCheckoutResponse> CreatePayOsPaymentAsync(int userId, int orderId, PayOsPaymentRequest request, CancellationToken cancellationToken = default)
    {
        var payment = await _dbContext.Payments.Include(item => item.Order).FirstOrDefaultAsync(item => item.OrderId == orderId && item.Order.UserId == userId, cancellationToken);
        if (payment == null) throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        if (payment.Status is "paid" or "refunded" or "cancelled") throw BusinessError(ErrorCodes.PaymentNotEligible, "Payment is not eligible for a PayOS attempt.");

        var active = await _dbContext.PaymentTransactions.FirstOrDefaultAsync(item => item.PaymentId == payment.Id && item.Provider == "payos" && item.Status == "pending", cancellationToken);
        if (active != null) return new PayOsCheckoutResponse { Transaction = Map(active), CheckoutUrl = active.CheckoutUrl!, QrCode = active.QrCode };

        if (payment.Amount <= 0 || payment.Amount != decimal.Truncate(payment.Amount) || payment.Amount > int.MaxValue)
            throw BusinessError(ErrorCodes.PaymentNotEligible, "Payment amount cannot be represented by PayOS.");
        if (string.IsNullOrWhiteSpace(_options.Value.ReturnUrl) || string.IsNullOrWhiteSpace(_options.Value.CancelUrl))
            throw ConfigurationError(ErrorCodes.PayOsConfigurationMissing, "PayOS return and cancel URLs are not configured.");

        payment.Method = "payos";
        var transaction = new PaymentTransaction
        {
            Payment = payment,
            Provider = "payos",
            ProviderOrderCode = CreateProviderOrderCode(payment.Id),
            Amount = payment.Amount,
            Status = "pending",
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.PaymentTransactions.Add(transaction);
        await _dbContext.SaveChangesAsync(cancellationToken);

        try
        {
            var result = await _gateway.CreatePaymentAsync(new PaymentGatewayCreateRequest(transaction.ProviderOrderCode, checked((int)payment.Amount), $"DoRentMe {payment.Order.OrderCode}", BuildUrl(_options.Value.ReturnUrl!, payment.OrderId), BuildUrl(_options.Value.CancelUrl!, payment.OrderId)), cancellationToken);
            transaction.CheckoutUrl = result.CheckoutUrl;
            transaction.QrCode = result.QrCode;
            transaction.ProviderTransactionId = result.ProviderTransactionId;
            transaction.ExpiredAt = result.ExpiredAt;
            transaction.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            return new PayOsCheckoutResponse { Transaction = Map(transaction), CheckoutUrl = result.CheckoutUrl, QrCode = result.QrCode };
        }
        catch (Exception exception) when (exception is not ApiException)
        {
            transaction.Status = "failed";
            transaction.UpdatedAt = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
            throw BusinessError(ErrorCodes.PayOsCreatePaymentFailed, "PayOS payment link could not be created.");
        }
    }

    public async Task<IReadOnlyList<PaymentTransactionResponse>> GetCustomerTransactionsAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var payment = await _dbContext.Payments.FirstOrDefaultAsync(item => item.OrderId == orderId && item.Order.UserId == userId, cancellationToken);
        if (payment == null) throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        return await MapQuery().Where(item => item.PaymentId == payment.Id).OrderByDescending(item => item.CreatedAt).Select(item => new PaymentTransactionResponse
        {
            Id = item.Id, PaymentId = item.PaymentId, Provider = item.Provider, ProviderOrderCode = item.ProviderOrderCode, ProviderTransactionId = item.ProviderTransactionId, Amount = item.Amount, Status = item.Status, CheckoutUrl = item.CheckoutUrl, QrCode = item.QrCode, CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt, PaidAt = item.PaidAt, ExpiredAt = item.ExpiredAt
        }).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<PaymentTransactionResponse>> GetAdminTransactionsAsync(int paymentId, CancellationToken cancellationToken = default)
    {
        if (!await _dbContext.Payments.AnyAsync(item => item.Id == paymentId, cancellationToken)) throw NotFound(ErrorCodes.PaymentNotFound, "Payment not found.");
        return await MapQuery().Where(item => item.PaymentId == paymentId).OrderByDescending(item => item.CreatedAt).Select(item => new PaymentTransactionResponse
        {
            Id = item.Id, PaymentId = item.PaymentId, Provider = item.Provider, ProviderOrderCode = item.ProviderOrderCode, ProviderTransactionId = item.ProviderTransactionId, Amount = item.Amount, Status = item.Status, CheckoutUrl = item.CheckoutUrl, QrCode = item.QrCode, CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt, PaidAt = item.PaidAt, ExpiredAt = item.ExpiredAt
        }).ToListAsync(cancellationToken);
    }

    public async Task<PaymentTransactionResponse> GetAdminTransactionAsync(int transactionId, CancellationToken cancellationToken = default)
    {
        var transaction = await MapQuery().FirstOrDefaultAsync(item => item.Id == transactionId, cancellationToken);
        if (transaction == null) throw NotFound(ErrorCodes.PaymentTransactionNotFound, "Payment transaction not found.");
        return Map(transaction);
    }

    public async Task ProcessPayOsWebhookAsync(PayOsWebhookRequest request, CancellationToken cancellationToken = default)
    {
        PaymentGatewayWebhookResult verified;
        try { verified = await _gateway.VerifyWebhookAsync(request, cancellationToken); }
        catch (Exception exception) when (exception is not ApiException) { throw BusinessError(ErrorCodes.PayOsInvalidWebhook, "PayOS webhook verification failed."); }

        var transaction = await _dbContext.PaymentTransactions.Include(item => item.Payment).FirstOrDefaultAsync(item => item.Provider == "payos" && item.ProviderOrderCode == verified.ProviderOrderCode, cancellationToken);
        if (transaction == null) throw NotFound(ErrorCodes.PaymentTransactionNotFound, "Payment transaction not found.");
        if (transaction.Status == "paid" && transaction.Payment.Status == "paid") return;
        if (TerminalStatuses.Contains(transaction.Status, StringComparer.Ordinal)) return;
        if (verified.Amount != transaction.Amount || verified.Amount != transaction.Payment.Amount) throw BusinessError(ErrorCodes.PaymentAmountMismatch, "PayOS amount does not match the expected payment amount.");

        transaction.UpdatedAt = DateTime.UtcNow;
        transaction.ProviderTransactionId = verified.ProviderTransactionId ?? transaction.ProviderTransactionId;
        if (!verified.IsSuccessful)
        {
            transaction.Status = "failed";
        }
        else
        {
            transaction.Status = "paid";
            transaction.PaidAt = DateTime.UtcNow;
            if (transaction.Payment.Status == "pending")
            {
                transaction.Payment.Status = "paid";
                transaction.Payment.PaidAt = DateTime.UtcNow;
                transaction.Payment.ProviderTransactionId = transaction.ProviderTransactionId;
            }
        }
        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    private IQueryable<PaymentTransaction> MapQuery() => _dbContext.PaymentTransactions.AsNoTracking();
    private static PaymentTransactionResponse Map(PaymentTransaction item) => new() { Id = item.Id, PaymentId = item.PaymentId, Provider = item.Provider, ProviderOrderCode = item.ProviderOrderCode, ProviderTransactionId = item.ProviderTransactionId, Amount = item.Amount, Status = item.Status, CheckoutUrl = item.CheckoutUrl, QrCode = item.QrCode, CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt, PaidAt = item.PaidAt, ExpiredAt = item.ExpiredAt };
    private static long CreateProviderOrderCode(int paymentId) => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000 + (Interlocked.Increment(ref _sequence) % 1000) + paymentId % 10;
    private static string BuildUrl(string template, int orderId) => template.Replace("{orderId}", orderId.ToString(System.Globalization.CultureInfo.InvariantCulture), StringComparison.Ordinal);
    private static ApiException NotFound(string code, string message) => new(code, message, StatusCodes.Status404NotFound);
    private static ApiException BusinessError(string code, string message) => new(code, message, StatusCodes.Status400BadRequest);
    private static ApiException ConfigurationError(string code, string message) => new(code, message, StatusCodes.Status503ServiceUnavailable);
}
