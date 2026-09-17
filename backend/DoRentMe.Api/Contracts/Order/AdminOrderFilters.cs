namespace DoRentMe.Api.Contracts.Order;

public class AdminOrderFilters
{
    public string? Status { get; set; }
    public int? ShopId { get; set; }
    public string? Search { get; set; }
    public DateOnly? CreatedFrom { get; set; }
    public DateOnly? CreatedTo { get; set; }
}
