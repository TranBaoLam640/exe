namespace DoRentMe.Api.Contracts.Inventory;

public class ProductAvailabilityResponse
{
    public int ProductId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public List<ProductVariantAvailabilityResponse> Variants { get; set; } = new();
}
