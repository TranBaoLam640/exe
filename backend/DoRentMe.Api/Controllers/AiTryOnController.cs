using System.Security.Claims;
using System.Text.Json;
using DoRentMe.Api.Contracts.Ai;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/tryon")]
[EnableRateLimiting("tryon-policy")]
public sealed class AiTryOnController : ControllerBase
{
    private readonly IAiGatewayService _aiGatewayService;
    private readonly ITryOnQuotaService _tryOnQuotaService;
    private readonly ILogger<AiTryOnController> _logger;

    public AiTryOnController(
        IAiGatewayService aiGatewayService,
        ITryOnQuotaService tryOnQuotaService,
        ILogger<AiTryOnController> logger)
    {
        _aiGatewayService = aiGatewayService;
        _tryOnQuotaService = tryOnQuotaService;
        _logger = logger;
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        TryOnCreateRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.HumanImage)
            || string.IsNullOrWhiteSpace(request.GarmentImageUrl))
        {
            return BadRequest(new
            {
                error = new
                {
                    message = "Thieu anh khach hang hoac anh san pham"
                }
            });
        }

        // Lấy thông tin định danh người dùng / thiết bị để kiểm tra hạn mức & chống gian lận
        int? userId = null;
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(idClaim) && int.TryParse(idClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var deviceFingerprint = Request.Headers["X-Device-Fingerprint"].FirstOrDefault();
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        // Kiểm tra hạn mức chống spam đa tài khoản
        var quota = await _tryOnQuotaService.CheckQuotaAsync(
            userId,
            deviceFingerprint,
            clientIp,
            cancellationToken);

        if (!quota.Allowed)
        {
            _logger.LogWarning("TryOn request rejected due to quota limit. Reason: {Reason}", quota.ReasonCode);
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                error = new
                {
                    code = quota.ReasonCode ?? "TRYON_QUOTA_EXCEEDED",
                    message = quota.Message ?? "Bạn đã sử dụng hết lượt thử đồ miễn phí. Vui lòng đăng ký gói AI để tiếp tục."
                }
            });
        }

        var result = await _aiGatewayService.CreateTryOnAsync(
            request,
            cancellationToken);

        // Nếu gọi thành công đến FASHN AI, ghi nhận sử dụng để trừ hạn mức
        if (result.StatusCode == StatusCodes.Status200OK)
        {
            var requestId = string.Empty;
            try
            {
                using var doc = JsonDocument.Parse(result.Content);
                if (doc.RootElement.TryGetProperty("requestId", out var rProp))
                {
                    requestId = rProp.GetString() ?? string.Empty;
                }
            }
            catch
            {
                // Ignore parse failures
            }

            await _tryOnQuotaService.RecordUsageAsync(
                userId,
                deviceFingerprint,
                clientIp,
                requestId,
                request.GarmentImageUrl,
                cancellationToken);
        }

        return AiContent(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetStatus(
        [FromQuery] string? id,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(id))
        {
            return BadRequest(new
            {
                error = new
                {
                    message = "Thieu request id"
                }
            });
        }

        var result = await _aiGatewayService.GetTryOnStatusAsync(
            id,
            cancellationToken);

        return AiContent(result);
    }

    [HttpGet("quota")]
    public async Task<IActionResult> GetQuota(CancellationToken cancellationToken)
    {
        int? userId = null;
        var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrWhiteSpace(idClaim) && int.TryParse(idClaim, out var parsedId))
        {
            userId = parsedId;
        }

        var deviceFingerprint = Request.Headers["X-Device-Fingerprint"].FirstOrDefault();
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString();

        var quota = await _tryOnQuotaService.CheckQuotaAsync(
            userId,
            deviceFingerprint,
            clientIp,
            cancellationToken);

        return Ok(new
        {
            allowed = quota.Allowed,
            remainingQuota = quota.RemainingQuota,
            message = quota.Message
        });
    }

    private static ContentResult AiContent(AiGatewayResult result)
    {
        return new ContentResult
        {
            StatusCode = result.StatusCode,
            ContentType = "application/json",
            Content = result.Content
        };
    }
}
