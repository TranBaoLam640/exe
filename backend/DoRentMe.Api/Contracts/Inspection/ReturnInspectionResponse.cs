namespace DoRentMe.Api.Contracts.Inspection;

public class ReturnInspectionResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int OrderItemId { get; set; }
    public int ProductInventoryItemId { get; set; }
    public string AssetCode { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string Size { get; set; } = null!;
    public string Color { get; set; } = null!;
    public string OperationalStatus { get; set; } = null!;
    public string ConditionAfterReturn { get; set; } = null!;
    public bool HasDamage { get; set; }
    public string? DamageDescription { get; set; }
    public decimal RecommendedDeduction { get; set; }
    public DateTime InspectedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
