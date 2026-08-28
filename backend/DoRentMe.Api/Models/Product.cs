namespace DoRentMe.Api.Models;

public sealed class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? ImageUrl { get; set; }
    public decimal Price1Day { get; set; }
    public decimal Price3Day { get; set; }
    public decimal Deposit { get; set; }
    public bool IsActive { get; set; } = true;
}
