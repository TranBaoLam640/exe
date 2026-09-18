namespace DoRentMe.Api.Contracts.Shipment;

public class ShipmentResponse
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public string? OrderCode { get; set; }
    public int? ShopId { get; set; }
    public string Direction { get; set; } = null!;
    public string Provider { get; set; } = null!;
    public string ServiceType { get; set; } = null!;
    public string Status { get; set; } = null!;
    public string? TrackingCode { get; set; }
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
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public List<ShipmentTrackingEventResponse> TrackingEvents { get; set; } = new();
}

public class ShipmentTrackingEventResponse
{
    public int Id { get; set; }
    public string Status { get; set; } = null!;
    public string? Message { get; set; }
    public string? Location { get; set; }
    public DateTime? ProviderEventTime { get; set; }
    public DateTime CreatedAt { get; set; }
}
