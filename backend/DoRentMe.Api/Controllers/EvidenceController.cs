using System.Security.Claims;
using System.Security.Cryptography;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Controllers;

[Authorize]
public class EvidenceController(DoRentMeDbContext db, IEvidenceStorage storage, IRefundService refunds) : ApiControllerBase
{
    private int UserId => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("api/orders/{orderId:int}/return-photos")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadReturn(int orderId, IFormFile file, CancellationToken cancellationToken)
    {
        var order = await db.Orders.SingleOrDefaultAsync(o => o.Id == orderId && o.UserId == UserId, cancellationToken);
        if (order == null) return NotFound();
        if (order.Status != "delivered") throw new ApiException("INVALID_EVIDENCE_STATE", "Return photos can only be uploaded for delivered orders.", 409);
        return await Upload(orderId, null, file, cancellationToken);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPost("api/admin/refunds/{refundId:int}/proof-photos")]
    [RequestSizeLimit(6 * 1024 * 1024)]
    public async Task<IActionResult> UploadRefund(int refundId, IFormFile file, CancellationToken cancellationToken)
    {
        var refund = await db.Refunds.SingleOrDefaultAsync(r => r.Id == refundId, cancellationToken);
        if (refund == null) return NotFound();
        if (refund.Type != "deposit" || refund.Status is not ("pending" or "processing" or "completed"))
            throw new ApiException("INVALID_EVIDENCE_STATE", "Proof can only be uploaded for an active or completed deposit refund.", 409);
        return await Upload(refund.OrderId, refund.Id, file, cancellationToken);
    }

    [Authorize(Roles = "ADMIN")]
    [HttpPut("api/admin/refunds/{refundId:int}/proof-photos")]
    public async Task<IActionResult> PublishRefundProof(int refundId, [FromBody] DoRentMe.Api.Contracts.Refund.RefundProofRequest request, CancellationToken cancellationToken)
    {
        var refund = await db.Refunds.SingleOrDefaultAsync(r => r.Id == refundId, cancellationToken);
        if (refund == null) return NotFound();
        if (refund.Type != "deposit" || refund.Status != "completed")
            throw new ApiException("INVALID_EVIDENCE_STATE", "Only completed deposit refunds can publish additional proof.", 409);
        var ids = request.PhotoIds.Distinct().ToList();
        if (ids.Count is < 1 or > 10)
            throw new ApiException("REFUND_PROOF_REQUIRED", "Provide between 1 and 10 proof photos.", 400);
        var photos = await db.EvidencePhotos.Where(p => ids.Contains(p.Id) && p.OrderId == refund.OrderId && p.RefundId == refundId && p.UploadedByUserId == UserId).ToListAsync(cancellationToken);
        if (photos.Count != ids.Count)
            throw new ApiException("INVALID_REFUND_PROOF", "Proof photos must be uploaded by you for this refund.", 400);
        foreach (var photo in photos) photo.Attached = true;
        await db.SaveChangesAsync(cancellationToken);
        return Success(await refunds.GetAdminRefundAsync(refundId, cancellationToken));
    }

    [HttpGet("api/evidence/{id:guid}")]
    public async Task<IActionResult> Read(Guid id, CancellationToken cancellationToken)
    {
        var photo = await db.EvidencePhotos.AsNoTracking().Include(p => p.Order).SingleOrDefaultAsync(p => p.Id == id, cancellationToken);
        if (photo == null || !(User.IsInRole("ADMIN") || photo.Order.UserId == UserId) || (!photo.Attached && photo.UploadedByUserId != UserId)) return NotFound();
        Response.Headers.CacheControl = "private, no-store";
        return File(await storage.GetAsync(photo.ObjectKey, cancellationToken), photo.ContentType);
    }

    private async Task<IActionResult> Upload(int orderId, int? refundId, IFormFile file, CancellationToken cancellationToken)
    {
        if (file.Length is <= 0 or > 5 * 1024 * 1024)
            throw new ApiException("INVALID_EVIDENCE_IMAGE", "Each photo must be at most 5 MB.", 400);
        using var stream = new MemoryStream();
        await file.CopyToAsync(stream, cancellationToken);
        var bytes = stream.ToArray();
        var type = DetectType(bytes);
        if (type == null) throw new ApiException("INVALID_EVIDENCE_IMAGE", "Only JPEG, PNG and WebP photos are supported.", 400);
        var hash = Convert.ToHexString(SHA256.HashData(bytes));
        var existing = await db.EvidencePhotos.FirstOrDefaultAsync(p => p.OrderId == orderId && p.RefundId == refundId && p.UploadedByUserId == UserId && p.ContentHash == hash, cancellationToken);
        if (existing != null) return Success(new { existing.Id });
        var photo = new EvidencePhoto { OrderId = orderId, RefundId = refundId, UploadedByUserId = UserId, ContentType = type, ContentHash = hash };
        photo.ObjectKey = $"evidence/{orderId}/{(refundId.HasValue ? "refund-" + refundId : "return")}/{photo.Id:N}";
        await storage.PutAsync(photo.ObjectKey, bytes, type, cancellationToken);
        db.EvidencePhotos.Add(photo);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedSuccess(new { photo.Id });
    }

    internal static string? DetectType(byte[] bytes)
    {
        if (bytes.Length >= 3 && bytes[0] == 0xff && bytes[1] == 0xd8 && bytes[2] == 0xff) return "image/jpeg";
        if (bytes.Length >= 8 && bytes.AsSpan(0, 8).SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 })) return "image/png";
        if (bytes.Length >= 12 && System.Text.Encoding.ASCII.GetString(bytes, 0, 4) == "RIFF" && System.Text.Encoding.ASCII.GetString(bytes, 8, 4) == "WEBP") return "image/webp";
        return null;
    }
}
