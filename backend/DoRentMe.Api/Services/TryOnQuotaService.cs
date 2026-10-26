using System.Net;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public sealed class TryOnQuotaService : ITryOnQuotaService
{
    private readonly DoRentMeDbContext _context;
    private readonly ICacheService _cache;
    private readonly IConfiguration _configuration;
    private readonly ILogger<TryOnQuotaService> _logger;

    public TryOnQuotaService(
        DoRentMeDbContext context,
        ICacheService cache,
        IConfiguration configuration,
        ILogger<TryOnQuotaService> logger)
    {
        _context = context;
        _cache = cache;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<QuotaCheckResult> CheckQuotaAsync(
        int? userId,
        string? deviceFingerprint,
        string? clientIp,
        CancellationToken cancellationToken = default)
    {
        var freeQuotaPerUser = _configuration.GetValue("TryOnSettings:FreeQuotaPerUser", 2);
        var freeQuotaPerDevice = _configuration.GetValue("TryOnSettings:FreeQuotaPerDevice", 2);
        var freeQuotaPerSubnetDaily = _configuration.GetValue("TryOnSettings:FreeQuotaPerSubnetDaily", 10);

        // 1. Kiểm tra theo Device Fingerprint (Chống reg nhiều acc trên cùng 1 máy)
        if (!string.IsNullOrWhiteSpace(deviceFingerprint))
        {
            var deviceKey = $"tryon:device:{deviceFingerprint.Trim()}";
            var deviceUsage = await _cache.GetCountAsync(deviceKey, cancellationToken);
            if (deviceUsage >= freeQuotaPerDevice)
            {
                _logger.LogWarning("Device {Fingerprint} exceeded free try-on quota ({Usage}/{Max})", deviceFingerprint, deviceUsage, freeQuotaPerDevice);
                return new QuotaCheckResult(
                    Allowed: false,
                    ReasonCode: "DEVICE_QUOTA_EXCEEDED",
                    Message: $"Thiết bị của bạn đã sử dụng hết {freeQuotaPerDevice} lượt thử đồ AI miễn phí. Vui lòng đăng ký gói AI để tiếp tục trải nghiệm!",
                    RemainingQuota: 0);
            }
        }

        // 2. Kiểm tra theo User ID đã đăng nhập
        if (userId.HasValue)
        {
            var userKey = $"tryon:user:{userId.Value}";
            var cachedUserUsage = await _cache.GetCountAsync(userKey, cancellationToken);

            var dbUserUsage = await _context.TryOnRequests
                .CountAsync(t => t.UserId == userId.Value && t.Status != "failed", cancellationToken);

            var totalUserUsage = Math.Max(cachedUserUsage, dbUserUsage);
            if (totalUserUsage >= freeQuotaPerUser)
            {
                _logger.LogWarning("User {UserId} exceeded free try-on quota ({Usage}/{Max})", userId.Value, totalUserUsage, freeQuotaPerUser);
                return new QuotaCheckResult(
                    Allowed: false,
                    ReasonCode: "USER_QUOTA_EXCEEDED",
                    Message: $"Tài khoản của bạn đã sử dụng hết {freeQuotaPerUser} lượt thử đồ AI miễn phí. Vui lòng nâng cấp gói để tiếp tục!",
                    RemainingQuota: 0);
            }

            var remaining = Math.Max(0, freeQuotaPerUser - (int)totalUserUsage);
            return new QuotaCheckResult(Allowed: true, RemainingQuota: remaining);
        }

        // 3. Kiểm tra dải IP Subnet (Chống bot spam nhiều IP trong cùng mạng)
        if (!string.IsNullOrWhiteSpace(clientIp))
        {
            var subnet = ExtractSubnet(clientIp);
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var subnetKey = $"tryon:subnet:{subnet}:{today}";
            var subnetUsage = await _cache.GetCountAsync(subnetKey, cancellationToken);
            if (subnetUsage >= freeQuotaPerSubnetDaily)
            {
                _logger.LogWarning("Subnet {Subnet} exceeded daily free try-on quota ({Usage}/{Max})", subnet, subnetUsage, freeQuotaPerSubnetDaily);
                return new QuotaCheckResult(
                    Allowed: false,
                    ReasonCode: "IP_SUB_QUOTA_EXCEEDED",
                    Message: "Dải mạng của bạn đã đạt giới hạn thử đồ miễn phí trong ngày. Vui lòng đăng nhập tài khoản để tiếp tục.",
                    RemainingQuota: 0);
            }
        }

        return new QuotaCheckResult(Allowed: true, RemainingQuota: freeQuotaPerDevice);
    }

    public async Task RecordUsageAsync(
        int? userId,
        string? deviceFingerprint,
        string? clientIp,
        string requestId,
        string garmentImageUrl,
        CancellationToken cancellationToken = default)
    {
        // 1. Tăng bộ đếm Device Fingerprint (lưu 90 ngày)
        if (!string.IsNullOrWhiteSpace(deviceFingerprint))
        {
            var deviceKey = $"tryon:device:{deviceFingerprint.Trim()}";
            await _cache.IncrementAsync(deviceKey, TimeSpan.FromDays(90), cancellationToken);
        }

        // 2. Tăng bộ đếm User ID (lưu 90 ngày)
        if (userId.HasValue)
        {
            var userKey = $"tryon:user:{userId.Value}";
            await _cache.IncrementAsync(userKey, TimeSpan.FromDays(90), cancellationToken);
        }

        // 3. Tăng bộ đếm Subnet hàng ngày (lưu 24 giờ)
        if (!string.IsNullOrWhiteSpace(clientIp))
        {
            var subnet = ExtractSubnet(clientIp);
            var today = DateTime.UtcNow.ToString("yyyyMMdd");
            var subnetKey = $"tryon:subnet:{subnet}:{today}";
            await _cache.IncrementAsync(subnetKey, TimeSpan.FromHours(24), cancellationToken);
        }
    }

    private static string ExtractSubnet(string ipString)
    {
        if (IPAddress.TryParse(ipString, out var ip))
        {
            if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetwork)
            {
                var bytes = ip.GetAddressBytes();
                return $"{bytes[0]}.{bytes[1]}.{bytes[2]}.0/24";
            }
            if (ip.AddressFamily == System.Net.Sockets.AddressFamily.InterNetworkV6)
            {
                var bytes = ip.GetAddressBytes();
                return $"{bytes[0]:x2}{bytes[1]:x2}:{bytes[2]:x2}{bytes[3]:x2}::/32";
            }
        }

        return "unknown";
    }
}
