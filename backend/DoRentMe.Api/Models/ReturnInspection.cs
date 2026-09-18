namespace DoRentMe.Api.Models;

public class ReturnInspection
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int OrderItemId { get; set; }
    public int ProductInventoryItemId { get; set; }
    public string ConditionAfterReturn { get; set; } = "GOOD";
    public bool HasDamage { get; set; }
    public string? DamageDescription { get; set; }
    public decimal RecommendedDeduction { get; set; }
    public int InspectorUserId { get; set; }
    public DateTime InspectedAt { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Order Order { get; set; } = null!;
    public OrderItem OrderItem { get; set; } = null!;
    public ProductInventoryItem ProductInventoryItem { get; set; } = null!;
    public User InspectorUser { get; set; } = null!;
}
