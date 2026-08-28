namespace DoRentMe.Api.Contracts;

public sealed record RegisterRequest(string Name, string Email, string? Phone, string Password);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthResponse(int UserId, string Name, string Email, string Role, string? Token);
