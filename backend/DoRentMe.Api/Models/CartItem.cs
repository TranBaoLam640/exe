namespace DoRentMe.Api.Models;

public class CartItem
{
    public int Id { get; set; }
    public int CartId { get; set; }
    public int ProductVariantId { get; set; }
    public int Quantity { get; set; } = 1;
    public DateOnly RentalStartDate { get; set; }
    public DateOnly RentalEndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Cart Cart { get; set; } = null!;
    public ProductVariant ProductVariant { get; set; } = null!;
}
