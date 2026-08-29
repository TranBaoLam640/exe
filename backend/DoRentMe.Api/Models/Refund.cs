namespace DoRentMe.Api.Models;

public class Refund
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int? PaymentId { get; set; }
    public string Type { get; set; } = "deposit";
    public string Status { get; set; } = "pending";
    public decimal Amount { get; set; }
    public string? Reason { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    public string? TransactionCode { get; set; }
    public int? RequestedByUserId { get; set; }
    public int? ProcessedByUserId { get; set; }
    public DateTime RequestedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }

    public Order Order { get; set; } = null!;
    public Payment? Payment { get; set; }
    public User? RequestedByUser { get; set; }
    public User? ProcessedByUser { get; set; }
}
