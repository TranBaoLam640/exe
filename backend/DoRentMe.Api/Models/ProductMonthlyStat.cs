namespace DoRentMe.Api.Models;

public class ProductMonthlyStat
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalOrders { get; set; }
    public int TotalQuantityRented { get; set; }
    public decimal RentRevenue { get; set; }
    public decimal DepositCollected { get; set; }
    public decimal DepositRefunded { get; set; }
    public decimal ShippingFee { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal CleaningCost { get; set; }
    public decimal MaintenanceCost { get; set; }
    public decimal GrossProfit { get; private set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
}
