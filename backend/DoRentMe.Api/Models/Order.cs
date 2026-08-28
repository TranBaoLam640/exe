namespace DoRentMe.Api.Models;

public sealed class Order
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerPhone { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string ShippingAddress { get; set; } = string.Empty;
    public string Status { get; set; } = "pending_confirmation";
    public decimal TotalRent { get; set; }
    public decimal TotalDeposit { get; set; }
    public decimal TotalDiscount { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
