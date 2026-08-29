namespace DoRentMe.Api.Models;

public class ProductInventoryItem
{
    public int Id { get; set; }
    public int ProductVariantId { get; set; }
    public string AssetCode { get; set; } = null!;
    public string Condition { get; set; } = "GOOD";
    public string Status { get; set; } = "AVAILABLE";
    public string? Notes { get; set; }
    public DateTime? AcquiredAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ProductVariant ProductVariant { get; set; } = null!;
}
