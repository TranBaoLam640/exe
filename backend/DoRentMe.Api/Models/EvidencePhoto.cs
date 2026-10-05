namespace DoRentMe.Api.Models;

public class EvidencePhoto
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int OrderId { get; set; }
    public int? RefundId { get; set; }
    public int UploadedByUserId { get; set; }
    public string ObjectKey { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public string ContentHash { get; set; } = null!;
    public bool Attached { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Order Order { get; set; } = null!;
    public Refund? Refund { get; set; }
}
