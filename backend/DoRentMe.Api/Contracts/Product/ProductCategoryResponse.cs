namespace DoRentMe.Api.Contracts.Product;

public class ProductCategoryResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;
}