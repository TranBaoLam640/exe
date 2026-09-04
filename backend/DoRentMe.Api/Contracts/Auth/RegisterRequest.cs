using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Auth;

public class RegisterRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string Email { get; set; } = null!;

    [Phone(ErrorMessage = "Invalid phone format")]
    [StringLength(20, ErrorMessage = "Phone cannot exceed 20 characters")]
    public string? Phone { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be between 6 and 100 characters")]
    public string Password { get; set; } = null!;

    [Required(ErrorMessage = "Role is required")]
    [RegularExpression("^(CUSTOMER|LENDER)$", ErrorMessage = "Role must be either CUSTOMER or LENDER")]
    public string Role { get; set; } = "CUSTOMER";
}
