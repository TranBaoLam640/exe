namespace DoRentMe.Api.Models;

public class Cart
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public string? SessionId { get; set; }
    public string Status { get; set; } = "active";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User? User { get; set; }
    public ICollection<CartItem> Items { get; set; } = new List<CartItem>();
}
