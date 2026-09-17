namespace DoRentMe.Api.Contracts.Order;

public class AdminOrderListItemResponse
{
    public int Id { get; set; }
    public string OrderCode { get; set; } = null!;
    public int? ShopId { get; set; }
    public string? ShopName { get; set; }
    public string Status { get; set; } = null!;
    public string CustomerName { get; set; } = null!;
    public string? CustomerEmail { get; set; }
    public decimal Total { get; set; }
    public decimal Deposit { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public int ItemCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
