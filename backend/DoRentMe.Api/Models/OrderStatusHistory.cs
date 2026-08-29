namespace DoRentMe.Api.Models;

public class OrderStatusHistory
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string? OldStatus { get; set; }
    public string NewStatus { get; set; } = null!;
    public string? Note { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public User? CreatedByUser { get; set; }
}
