namespace DoRentMe.Api.Contracts.Payment;

public class PaymentTransactionResponse
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string Provider { get; set; } = null!;
    public long ProviderOrderCode { get; set; }
    public string? ProviderTransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiredAt { get; set; }
}
