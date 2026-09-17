using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Payment;

public class PaymentStatusUpdateRequest
{
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = null!;

    [MaxLength(100)]
    public string? TransactionCode { get; set; }
}
