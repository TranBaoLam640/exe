namespace DoRentMe.Api.Models;

public class UserAddress
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string ReceiverName { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string AddressLine { get; set; } = null!;
    public string? Ward { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public string? Note { get; set; }
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
}
