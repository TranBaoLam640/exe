namespace DoRentMe.Api.Models;

public class ShipmentTrackingEvent
{
    public int Id { get; set; }
    public int ShipmentId { get; set; }
    public string Status { get; set; } = null!;
    public string? Message { get; set; }
    public string? Location { get; set; }
    public string? ProviderEventCode { get; set; }
    public DateTime? ProviderEventTime { get; set; }
    public string? RawEvent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Shipment Shipment { get; set; } = null!;
}
