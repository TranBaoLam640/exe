using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Cart;

public class CartItemRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ProductVariantId must be greater than 0.")]
    public int ProductVariantId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Quantity must be greater than 0.")]
    public int Quantity { get; set; } = 1;

    public DateOnly RentalStartDate { get; set; }

    public DateOnly RentalEndDate { get; set; }
}
