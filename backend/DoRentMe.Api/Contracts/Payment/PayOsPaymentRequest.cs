using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Payment;

public class PayOsPaymentRequest
{
    [MaxLength(1000)]
    public string? ReturnUrl { get; set; }

    [MaxLength(1000)]
    public string? CancelUrl { get; set; }
}
