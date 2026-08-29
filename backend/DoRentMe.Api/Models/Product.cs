namespace DoRentMe.Api.Models;

public class Product
{
    public int Id { get; set; }
    public int? ShopId { get; set; }
    public int OwnerUserId { get; set; }
    public int CategoryId { get; set; }
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
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Shop? Shop { get; set; }
    public User OwnerUser { get; set; } = null!;
    public Category Category { get; set; } = null!;
    public Brand? Brand { get; set; }
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
