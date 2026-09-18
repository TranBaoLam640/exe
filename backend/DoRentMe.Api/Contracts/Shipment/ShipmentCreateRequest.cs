using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Shipment;

public class ShipmentCreateRequest
{
    [MaxLength(50)]
    public string? Provider { get; set; }

    [MaxLength(100)]
    public string? TrackingCode { get; set; }

    [Range(0, double.MaxValue)]
    public decimal ShippingFee { get; set; }

    [MaxLength(50)]
    public string? ServiceType { get; set; }
}
