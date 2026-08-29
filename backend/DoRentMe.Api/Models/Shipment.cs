namespace DoRentMe.Api.Models;

public class Shipment
{
    public int Id { get; set; }
    public int? ShopId { get; set; }
    public int OrderId { get; set; }
    public string Direction { get; set; } = "outbound";
    public string Provider { get; set; } = "SPX";
    public string ServiceType { get; set; } = "instant";
    public string Status { get; set; } = "pending";
    public string? TrackingCode { get; set; }
    public string? ProviderOrderCode { get; set; }
    public string SenderName { get; set; } = null!;
    public string SenderPhone { get; set; } = null!;
    public string SenderAddress { get; set; } = null!;
    public string ReceiverName { get; set; } = null!;
    public string ReceiverPhone { get; set; } = null!;
    public string ReceiverAddress { get; set; } = null!;
    public decimal ShippingFee { get; set; }
    public decimal CodAmount { get; set; }
    public DateTime? PickupTime { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? RawProviderResponse { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Shop? Shop { get; set; }
    public Order Order { get; set; } = null!;
    public ICollection<ShipmentTrackingEvent> TrackingEvents { get; set; } = new List<ShipmentTrackingEvent>();
}
