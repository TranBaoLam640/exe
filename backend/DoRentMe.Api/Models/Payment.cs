namespace DoRentMe.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string Method { get; set; } = "bank_transfer";
    public string Status { get; set; } = "pending";
    public decimal Amount { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    public string? TransferContent { get; set; }
    public string? TransactionCode { get; set; }
    public string? ProviderTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public int? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public User? ConfirmedByUser { get; set; }
}
