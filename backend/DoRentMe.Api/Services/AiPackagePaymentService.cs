using System.Globalization;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Payment;
using Microsoft.Extensions.Options;

namespace DoRentMe.Api.Services;

/// <summary>
/// Creates PayOS payment links for AI try-on packages and verifies their status
/// directly with PayOS, so packages are only activated after a real payment.
/// </summary>
public sealed class AiPackagePaymentService : IAiPackagePaymentService
{
    // Server-side source of truth for AI package prices (must match frontend AI_PACKAGES).
    private static readonly IReadOnlyDictionary<string, (int Amount, string Description)> Packages =
        new Dictionary<string, (int, string)>(StringComparer.Ordinal)
        {
            ["ai_single"] = (1000, "DRMAI1K"),
            ["ai_day_pass"] = (10000, "DRMAI10K"),
            ["ai_month_pass"] = (50000, "DRMAI50K"),
        };

    private static readonly TimeSpan RecordLifetime = TimeSpan.FromDays(3);
    private static long _sequence;

    private readonly IPaymentGateway _gateway;
    private readonly ICacheService _cache;
    private readonly IOptions<PayOsOptions> _options;
    private readonly ILogger<AiPackagePaymentService> _logger;

    public AiPackagePaymentService(
        IPaymentGateway gateway,
        ICacheService cache,
        IOptions<PayOsOptions> options,
        ILogger<AiPackagePaymentService> logger)
    {
        _gateway = gateway;
        _cache = cache;
        _options = options;
        _logger = logger;
    }

    public async Task<AiPackagePaymentResponse> CreatePaymentAsync(string packageId, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(packageId) || !Packages.TryGetValue(packageId.Trim(), out var package))
            throw new ApiException(ErrorCodes.PaymentNotEligible, "AI package does not exist.", StatusCodes.Status400BadRequest);

        var frontendOrigin = ResolveFrontendOrigin();
        var orderCode = CreateOrderCode();
        var record = new AiPackagePaymentRecord
        {
            OrderCode = orderCode,
            PackageId = packageId.Trim(),
            Amount = package.Amount,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
        };

        try
        {
            var orderCodeText = orderCode.ToString(CultureInfo.InvariantCulture);
            var result = await _gateway.CreatePaymentAsync(new PaymentGatewayCreateRequest(
                orderCode,
                package.Amount,
                package.Description,
                $"{frontendOrigin}/ai-tryon?aiPayment=return&aiOrderCode={orderCodeText}",
                $"{frontendOrigin}/ai-tryon?aiPayment=cancel&aiOrderCode={orderCodeText}"), cancellationToken);

            record.CheckoutUrl = result.CheckoutUrl;
            record.QrCode = result.QrCode;
        }
        catch (Exception exception) when (exception is not ApiException)
        {
            _logger.LogError(exception, "Failed to create PayOS link for AI package {PackageId}", packageId);
            throw new ApiException(ErrorCodes.PayOsCreatePaymentFailed, "PayOS payment link could not be created.", StatusCodes.Status400BadRequest);
        }

        await SaveAsync(record, cancellationToken);
        return Map(record);
    }

    public async Task<AiPackagePaymentResponse> GetStatusAsync(long orderCode, CancellationToken cancellationToken = default)
    {
        var record = await RefreshAsync(orderCode, cancellationToken);
        return Map(record);
    }

    public async Task<AiPackagePaymentResponse> ClaimAsync(long orderCode, CancellationToken cancellationToken = default)
    {
        var record = await RefreshAsync(orderCode, cancellationToken);
        if (!record.IsPaid)
            throw new ApiException(ErrorCodes.InvalidPaymentStatus, "Payment has not been completed.", StatusCodes.Status400BadRequest);
        if (record.IsClaimed)
            throw new ApiException(ErrorCodes.InvalidPaymentTransition, "This payment has already been used to activate a package.", StatusCodes.Status409Conflict);

        record.IsClaimed = true;
        record.ClaimedAt = DateTime.UtcNow;
        await SaveAsync(record, cancellationToken);
        return Map(record);
    }

    private async Task<AiPackagePaymentRecord> RefreshAsync(long orderCode, CancellationToken cancellationToken)
    {
        var record = await _cache.GetAsync<AiPackagePaymentRecord>(CacheKey(orderCode), cancellationToken);
        if (record == null)
            throw new ApiException(ErrorCodes.PaymentTransactionNotFound, "AI package payment not found.", StatusCodes.Status404NotFound);

        if (record.IsPaid || record.Status is "CANCELLED" or "EXPIRED")
            return record;

        PaymentGatewayStatusResult status;
        try
        {
            status = await _gateway.GetPaymentStatusAsync(orderCode, cancellationToken);
        }
        catch (Exception exception) when (exception is not ApiException)
        {
            _logger.LogWarning(exception, "Failed to verify PayOS status for AI order {OrderCode}", orderCode);
            throw new ApiException(ErrorCodes.PayOsCreatePaymentFailed, "PayOS payment status could not be verified.", StatusCodes.Status400BadRequest);
        }

        var normalizedStatus = (status.Status ?? string.Empty).ToUpperInvariant();
        if (status.IsPaid)
        {
            if (status.Amount != record.Amount)
                throw new ApiException(ErrorCodes.PaymentAmountMismatch, "PayOS amount does not match the expected package price.", StatusCodes.Status400BadRequest);

            record.IsPaid = true;
            record.Status = "PAID";
            record.PaidAt ??= DateTime.UtcNow;
            await SaveAsync(record, cancellationToken);
        }
        else if (normalizedStatus is "CANCELLED" or "EXPIRED")
        {
            record.Status = normalizedStatus;
            await SaveAsync(record, cancellationToken);
        }
        else if (!string.IsNullOrWhiteSpace(normalizedStatus))
        {
            record.Status = normalizedStatus;
        }

        return record;
    }

    private string ResolveFrontendOrigin()
    {
        var returnUrl = _options.Value.ReturnUrl;
        if (string.IsNullOrWhiteSpace(returnUrl) || !Uri.TryCreate(returnUrl.Replace("{orderId}", "0", StringComparison.Ordinal), UriKind.Absolute, out var uri))
            throw new ApiException(ErrorCodes.PayOsConfigurationMissing, "PayOS return URL is not configured.", StatusCodes.Status503ServiceUnavailable);

        return uri.GetLeftPart(UriPartial.Authority);
    }

    private Task SaveAsync(AiPackagePaymentRecord record, CancellationToken cancellationToken) =>
        _cache.SetAsync(CacheKey(record.OrderCode), record, RecordLifetime, cancellationToken);

    private static string CacheKey(long orderCode) => $"aipay:{orderCode.ToString(CultureInfo.InvariantCulture)}";

    private static long CreateOrderCode() =>
        DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000 + (Interlocked.Increment(ref _sequence) % 1000);

    private static AiPackagePaymentResponse Map(AiPackagePaymentRecord record) => new()
    {
        OrderCode = record.OrderCode,
        PackageId = record.PackageId,
        Amount = record.Amount,
        Status = record.Status,
        IsPaid = record.IsPaid,
        IsClaimed = record.IsClaimed,
        CheckoutUrl = record.CheckoutUrl,
        QrCode = record.QrCode,
        CreatedAt = record.CreatedAt,
    };

    private sealed class AiPackagePaymentRecord
    {
        public long OrderCode { get; set; }
        public string PackageId { get; set; } = string.Empty;
        public int Amount { get; set; }
        public string Status { get; set; } = "PENDING";
        public bool IsPaid { get; set; }
        public bool IsClaimed { get; set; }
        public string? CheckoutUrl { get; set; }
        public string? QrCode { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public DateTime? ClaimedAt { get; set; }
    }
}

