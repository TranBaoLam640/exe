using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Order;

public class OrderStatusUpdateRequest
{
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = null!;

    [MaxLength(500)]
    public string? Note { get; set; }
}
