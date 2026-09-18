namespace DoRentMe.Api.Contracts.Shipment;

public class ShipmentQueryRequest
{
    public string? Status { get; set; }
    public string? Provider { get; set; }
    public int? OrderId { get; set; }
    public string? TrackingCode { get; set; }
}
