namespace DoRentMe.Api.Models;

public class Order
{
    public int Id { get; set; }
    public int? ShopId { get; set; }
    public string OrderCode { get; set; } = null!;
    public int? UserId { get; set; }
    public string CustomerName { get; set; } = null!;
    public string CustomerPhone { get; set; } = null!;
    public string? CustomerEmail { get; set; }
    public string ShippingAddress { get; set; } = null!;
    public string? CustomerNote { get; set; }
    public string Status { get; set; } = "pending_confirmation";
    public decimal TotalRent { get; set; }
    public decimal TotalDeposit { get; set; }
    public decimal TotalDiscount { get; set; }
    public decimal TotalAmount { get; private set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool DeliveryConfirmed { get; set; }
    public DateTime? ReturnRequestedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Shop? Shop { get; set; }
    public User? User { get; set; }
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}
