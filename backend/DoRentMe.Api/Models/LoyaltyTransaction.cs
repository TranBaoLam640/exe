namespace DoRentMe.Api.Models;

public class LoyaltyTransaction
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? OrderId { get; set; }
    public int Points { get; set; }
    public string Type { get; set; } = null!;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User User { get; set; } = null!;
    public Order? Order { get; set; }
}
