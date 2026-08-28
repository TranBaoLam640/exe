namespace DoRentMe.Api.Contracts;

public sealed record CreateOrderRequest(
    string CustomerName,
    string CustomerPhone,
    string? CustomerEmail,
    string ShippingAddress,
    string? CustomerNote,
    DateOnly StartDate,
    DateOnly EndDate);
