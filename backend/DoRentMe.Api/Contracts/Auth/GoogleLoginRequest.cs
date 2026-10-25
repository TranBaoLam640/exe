using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Auth;

public class GoogleLoginRequest
{
    [Required]
    [MaxLength(10000)]
    public string IdToken { get; set; } = null!;
}
