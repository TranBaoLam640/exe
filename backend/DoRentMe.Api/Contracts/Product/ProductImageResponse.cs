namespace DoRentMe.Api.Contracts.Product;

public class ProductImageResponse
{
    public int Id { get; set; }

    public string ImageUrl { get; set; } = null!;

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}
