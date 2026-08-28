namespace DoRentMe.Api.Models;

public sealed class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = "CUSTOMER";
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
}
