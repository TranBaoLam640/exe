namespace DoRentMe.Api.Contracts;

public sealed record AddCartItemRequest(int ProductId, int Quantity, DateOnly RentalStartDate, DateOnly RentalEndDate);

public sealed record UpdateCartItemRequest(int Quantity);
