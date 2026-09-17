namespace DoRentMe.Api.Contracts.Refund;

public class RefundFilters
{
    public string? Status { get; set; }
    public string? Type { get; set; }
    public int? OrderId { get; set; }
}
