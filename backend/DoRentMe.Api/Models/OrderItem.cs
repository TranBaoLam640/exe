namespace DoRentMe.Api.Models;

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int ProductVariantId { get; set; }
    public string ProductNameSnapshot { get; set; } = null!;
    public string SizeSnapshot { get; set; } = null!;
    public string ColorSnapshot { get; set; } = null!;
    public int Quantity { get; set; }
    public DateOnly RentalStartDate { get; set; }
    public DateOnly RentalEndDate { get; set; }
    public int RentalDays { get; set; }
    public decimal PricePerItem { get; set; }
    public decimal DepositPerItem { get; set; }
    public decimal LineSubtotal { get; set; }
    public decimal DepositSubtotal { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public Product Product { get; set; } = null!;
    public ProductVariant ProductVariant { get; set; } = null!;
}
