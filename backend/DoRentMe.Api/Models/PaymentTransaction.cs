namespace DoRentMe.Api.Models;

public class PaymentTransaction
{
    public int Id { get; set; }
    public int PaymentId { get; set; }
    public string Provider { get; set; } = "payos";
    public long ProviderOrderCode { get; set; }
    public string? ProviderTransactionId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = "pending";
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ExpiredAt { get; set; }

    public Payment Payment { get; set; } = null!;
}
