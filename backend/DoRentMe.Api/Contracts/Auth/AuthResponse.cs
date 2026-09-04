namespace DoRentMe.Api.Contracts.Auth;

public class AuthResponse
{
    public int UserId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Role { get; set; } = null!;
    public string Token { get; set; } = null!;
    public int LoyaltyPoints { get; set; }
}
