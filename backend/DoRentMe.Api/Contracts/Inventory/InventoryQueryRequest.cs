namespace DoRentMe.Api.Contracts.Inventory;

public class InventoryQueryRequest
{
    public int? ProductId { get; set; }

    public int? VariantId { get; set; }

    public string? Status { get; set; }

    public string? Condition { get; set; }
}
