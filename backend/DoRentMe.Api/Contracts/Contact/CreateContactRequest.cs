using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Contact;

public class CreateContactRequest
{
    [Required]
    public string Name { get; set; } = null!;

    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    [Required]
    public string Message { get; set; } = null!;
}