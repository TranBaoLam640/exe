namespace DoRentMe.Api.Contracts.Product;

public class ProductVariantResponse
{
    public int Id { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public bool IsActive { get; set; }

    public int TotalStock { get; set; }

    public int AvailableStock { get; set; }

    public List<string> Conditions { get; set; } = new();

    public ProductVariantPriceResponse Price { get; set; } = new();
}

public class ProductVariantPriceResponse
{
    public decimal Price1Day { get; set; }

    public decimal Price3Day { get; set; }

    public decimal ExtraDayPrice { get; set; }

    public decimal PriceDeposit { get; set; }
}
