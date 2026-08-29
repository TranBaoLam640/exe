namespace DoRentMe.Api.Models;

public class Shop
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Phone { get; set; } = null!;
    public string? Email { get; set; }
    public string Address { get; set; } = null!;
    public string? Ward { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
