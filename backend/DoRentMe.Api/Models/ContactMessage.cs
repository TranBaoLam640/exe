namespace DoRentMe.Api.Models;

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string? Subject { get; set; }
    public string Message { get; set; } = null!;
    public string Status { get; set; } = "new";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
