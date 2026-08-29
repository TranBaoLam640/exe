namespace DoRentMe.Api.Models;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Size { get; set; } = null!;
    public string Color { get; set; } = null!;
    public string? VariantCode { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Product Product { get; set; } = null!;
    public ICollection<ProductInventoryItem> InventoryItems { get; set; } = new List<ProductInventoryItem>();
}
