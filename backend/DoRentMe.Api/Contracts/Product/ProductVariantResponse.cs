public class ProductVariantResponse
{
    public int Id { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public bool IsActive { get; set; }
}