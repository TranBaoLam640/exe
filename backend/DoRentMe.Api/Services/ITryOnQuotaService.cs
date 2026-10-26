namespace DoRentMe.Api.Services;

public record QuotaCheckResult(
    bool Allowed,
    string? ReasonCode = null,
    string? Message = null,
    int RemainingQuota = 0);

public interface ITryOnQuotaService
{
    Task<QuotaCheckResult> CheckQuotaAsync(
        int? userId,
        string? deviceFingerprint,
        string? clientIp,
        CancellationToken cancellationToken = default);

    Task RecordUsageAsync(
        int? userId,
        string? deviceFingerprint,
        string? clientIp,
        string requestId,
        string garmentImageUrl,
        CancellationToken cancellationToken = default);
}
