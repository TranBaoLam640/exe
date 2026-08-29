namespace DoRentMe.Api.Models;

public class RentalReservation
{
    public int Id { get; set; }
    public int OrderItemId { get; set; }
    public int ProductInventoryItemId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public string Status { get; set; } = "RESERVED";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public OrderItem OrderItem { get; set; } = null!;
    public ProductInventoryItem ProductInventoryItem { get; set; } = null!;
}
