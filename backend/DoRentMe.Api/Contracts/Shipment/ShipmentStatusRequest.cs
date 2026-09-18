using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Shipment;

public class ShipmentStatusRequest
{
    [Required]
    public string Status { get; set; } = null!;

    [MaxLength(500)]
    public string? Note { get; set; }
}
