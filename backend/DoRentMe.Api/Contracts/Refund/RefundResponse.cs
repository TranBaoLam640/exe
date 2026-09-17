namespace DoRentMe.Api.Contracts.Refund;

public class RefundResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? PaymentId { get; set; }
    public string Type { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string? TransactionCode { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}
