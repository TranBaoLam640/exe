namespace DoRentMe.Api.Contracts.Cart;

public class CartResponse
{
    public int Id { get; set; }

    public string Status { get; set; } = null!;

    public List<CartItemResponse> Items { get; set; } = new();

    public int ItemCount { get; set; }

    public decimal Subtotal { get; set; }

    public decimal DepositTotal { get; set; }

    public CartDiscountPreviewResponse? Discount { get; set; }

    public CartShippingPreviewResponse? Shipping { get; set; }

    public decimal GrandTotalPreview { get; set; }
}

public class CartItemResponse
{
    public int Id { get; set; }

    public int ProductId { get; set; }

    public string ProductName { get; set; } = null!;

    public string ProductSlug { get; set; } = null!;

    public int VariantId { get; set; }

    public string? VariantCode { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? Image { get; set; }

    public int Quantity { get; set; }

    public DateOnly RentalStartDate { get; set; }

    public DateOnly RentalEndDate { get; set; }

    public int RentalDays { get; set; }

    public int AvailableStock { get; set; }

    public decimal RentalPrice { get; set; }

    public decimal LineSubtotal { get; set; }

    public decimal Deposit { get; set; }
}

public class CartDiscountPreviewResponse
{
    public string Code { get; set; } = null!;

    public string DiscountType { get; set; } = null!;

    public decimal DiscountValue { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal TotalAfterDiscount { get; set; }
}

public class CartShippingPreviewResponse
{
    public bool Available { get; set; }

    public decimal? ShippingFee { get; set; }

    public string? Message { get; set; }
}
