using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Refund;

public class RefundStatusUpdateRequest
{
    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = null!;

    [MaxLength(100)]
    public string? TransactionCode { get; set; }
    [Required]
    public List<Guid> PhotoIds { get; set; } = new();
}
