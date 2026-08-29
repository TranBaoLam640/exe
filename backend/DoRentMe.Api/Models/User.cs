namespace DoRentMe.Api.Models;

public class User
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = null!;
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;
    public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
    public ICollection<Product> OwnedProducts { get; set; } = new List<Product>();
}
