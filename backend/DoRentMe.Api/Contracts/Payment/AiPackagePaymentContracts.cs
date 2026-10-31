namespace DoRentMe.Api.Contracts.Payment;

public class AiPackagePaymentCreateRequest
{
    public string PackageId { get; set; } = string.Empty;
}

public class AiPackagePaymentResponse
{
    public long OrderCode { get; set; }
    public string PackageId { get; set; } = string.Empty;
    public int Amount { get; set; }
    public string Status { get; set; } = "PENDING";
    public bool IsPaid { get; set; }
    public bool IsClaimed { get; set; }
    public string? CheckoutUrl { get; set; }
    public string? QrCode { get; set; }
    public DateTime CreatedAt { get; set; }
}

