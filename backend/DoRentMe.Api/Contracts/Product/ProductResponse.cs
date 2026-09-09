namespace DoRentMe.Api.Contracts.Product;

public class ProductResponse
{
    public int Id { get; set; }

    public int ShopId { get; set; }

    public int? BrandId { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price1Day { get; set; }

    public decimal Price3Day { get; set; }

    public decimal ExtraDayPrice { get; set; }

    public decimal? PriceTag { get; set; }

    public decimal PriceDeposit { get; set; }

    public decimal? PurchaseCost { get; set; }

    public decimal CleaningCost { get; set; }

    public decimal MaintenanceCost { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public List<ProductCategoryResponse> Categories { get; set; } = new();

    public List<ProductVariantResponse> Variants { get; set; } = new();
}