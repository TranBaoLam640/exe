using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductCreateRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ShopId must be greater than 0.")]
    public int ShopId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "BrandId must be greater than 0.")]
    public int? BrandId { get; set; }

    [MinLength(1, ErrorMessage = "At least one category is required.")]
    public List<int> CategoryIds { get; set; } = new();

    [Required(ErrorMessage = "Product name is required.")]
    [MaxLength(200, ErrorMessage = "Product name cannot exceed 200 characters.")]
    public string Name { get; set; } = null!;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999",
        ErrorMessage = "Price1Day must be greater than 0.")]
    public decimal Price1Day { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999",
        ErrorMessage = "Price3Day must be greater than 0.")]
    public decimal Price3Day { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "ExtraDayPrice cannot be negative.")]
    public decimal ExtraDayPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PriceTag cannot be negative.")]
    public decimal? PriceTag { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PriceDeposit cannot be negative.")]
    public decimal PriceDeposit { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PurchaseCost cannot be negative.")]
    public decimal? PurchaseCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "CleaningCost cannot be negative.")]
    public decimal CleaningCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "MaintenanceCost cannot be negative.")]
    public decimal MaintenanceCost { get; set; }

    public List<ProductVariantCreateRequest> Variants { get; set; } = new();
}