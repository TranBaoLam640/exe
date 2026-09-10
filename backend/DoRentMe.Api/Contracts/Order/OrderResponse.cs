namespace DoRentMe.Api.Contracts.Order;

public class CheckoutResponse
{
    public List<OrderResponse> Orders { get; set; } = new();
}

public class OrderResponse
{
    public int Id { get; set; }

    public string OrderCode { get; set; } = null!;

    public int? ShopId { get; set; }

    public string? ShopName { get; set; }

    public string Status { get; set; } = null!;

    public OrderCustomerResponse Customer { get; set; } = new();

    public List<OrderItemResponse> Items { get; set; } = new();

    public OrderTotalsResponse Totals { get; set; } = new();

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public bool DeliveryConfirmed { get; set; }

    public DateTime? ReturnRequestedAt { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<OrderStatusHistoryResponse> History { get; set; } = new();
}

public class OrderCustomerResponse
{
    public string Name { get; set; } = null!;

    public string Phone { get; set; } = null!;

    public string? Email { get; set; }

    public string Address { get; set; } = null!;

    public string? Note { get; set; }
}

public class OrderItemResponse
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public int ProductVariantId { get; set; }

    public string Name { get; set; } = null!;

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? Image { get; set; }

    public int Quantity { get; set; }

    public DateOnly RentalStartDate { get; set; }

    public DateOnly RentalEndDate { get; set; }

    public int RentalDays { get; set; }

    public decimal PricePerItem { get; set; }

    public decimal DepositPerItem { get; set; }

    public decimal LineSubtotal { get; set; }

    public decimal DepositSubtotal { get; set; }
}

public class OrderTotalsResponse
{
    public decimal Rent { get; set; }

    public decimal Deposit { get; set; }

    public decimal Discount { get; set; }

    public decimal Total { get; set; }
}

public class OrderStatusHistoryResponse
{
    public string? OldStatus { get; set; }

    public string Status { get; set; } = null!;

    public string? Note { get; set; }

    public int? CreatedByUserId { get; set; }

    public DateTime At { get; set; }
}
