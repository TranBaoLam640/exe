using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Cart;

public class DiscountPreviewRequest
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = null!;
}
