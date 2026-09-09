using System.ComponentModel.DataAnnotations;
public class ProductVariantCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Size { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Color { get; set; } = null!;
}