using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Refund;

public class RefundProofRequest
{
    [Required]
    public List<Guid> PhotoIds { get; set; } = new();
}
