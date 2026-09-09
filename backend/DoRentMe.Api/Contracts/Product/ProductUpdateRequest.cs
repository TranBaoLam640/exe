using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductUpdateRequest
{
    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [MinLength(1, ErrorMessage = "At least one category is required.")]
    public List<int> CategoryIds { get; set; } = new();

    [Required(ErrorMessage = "Product name is required.")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999")]
    public decimal Price1Day { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999")]
    public decimal Price3Day { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal ExtraDayPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? PriceTag { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal PriceDeposit { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? PurchaseCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal CleaningCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal MaintenanceCost { get; set; }

    public bool IsActive { get; set; }

    public List<ProductVariantUpdateRequest> Variants { get; set; } = new();
}