namespace DoRentMe.Api.Models;

public class TryOnRequest
{
    public int Id { get; set; }
    public int? UserId { get; set; }
    public int ProductId { get; set; }
    public string? RequestId { get; set; }
    public string UserImageUrl { get; set; } = null!;
    public string GarmentImageUrl { get; set; } = null!;
    public string? ResultImageUrl { get; set; }
    public string Status { get; set; } = "pending";
    public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }

    public User? User { get; set; }
    public Product Product { get; set; } = null!;
}
