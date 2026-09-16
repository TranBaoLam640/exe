namespace DoRentMe.Api.Contracts.Inventory;

public class ProductVariantAvailabilityResponse
{
    public int VariantId { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public int TotalInventory { get; set; }

    public int AvailableInventory { get; set; }

    public bool IsAvailable { get; set; }
}
