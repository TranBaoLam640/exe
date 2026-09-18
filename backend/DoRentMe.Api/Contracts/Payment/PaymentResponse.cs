namespace DoRentMe.Api.Contracts.Payment;

public class PaymentResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string Method { get; set; } = null!;
    public string Status { get; set; } = null!;
    public decimal Amount { get; set; }
    public decimal RentalAmount { get; set; }
    public decimal DepositAmount { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    public string? TransferContent { get; set; }
    public string? TransactionCode { get; set; }
    public string? ProviderTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public PaymentTransactionResponse? LatestTransaction { get; set; }
}
