using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductVariantUpdateRequest
{
    public int? Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Size { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Color { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}