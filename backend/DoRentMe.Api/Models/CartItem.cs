namespace DoRentMe.Api.Models;

public sealed class CartItem
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int Quantity { get; set; }
    public DateOnly RentalStartDate { get; set; }
    public DateOnly RentalEndDate { get; set; }
}
