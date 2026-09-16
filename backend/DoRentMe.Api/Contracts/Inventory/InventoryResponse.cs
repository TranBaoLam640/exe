namespace DoRentMe.Api.Contracts.Inventory;

public class InventoryResponse
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string ProductName { get; set; } = null!;

    public int ProductVariantId { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public string AssetCode { get; set; } = null!;

    public string Condition { get; set; } = null!;

    public string Status { get; set; } = null!;

    public string? Notes { get; set; }

    public DateTime? AcquiredAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
