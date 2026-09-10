using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Order;

public class CheckoutRequest
{
    [Required]
    [MaxLength(100)]
    public string CustomerName { get; set; } = null!;

    [Required]
    [MaxLength(20)]
    public string CustomerPhone { get; set; } = null!;

    [EmailAddress]
    [MaxLength(150)]
    public string? CustomerEmail { get; set; }

    [Required]
    [MaxLength(500)]
    public string ShippingAddress { get; set; } = null!;

    [MaxLength(500)]
    public string? CustomerNote { get; set; }

    [MaxLength(50)]
    public string? VoucherCode { get; set; }
}
