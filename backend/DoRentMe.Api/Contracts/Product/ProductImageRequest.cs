using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductImageRequest
{
    [Required]
    [MaxLength(500)]
    public string ImageUrl { get; set; } = null!;

    public bool IsPrimary { get; set; }

    [Range(0, int.MaxValue)]
    public int SortOrder { get; set; }
}
