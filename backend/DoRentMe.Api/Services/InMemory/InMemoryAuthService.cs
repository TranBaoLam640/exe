using DoRentMe.Api.Contracts;
using DoRentMe.Api.Services.Abstractions;

namespace DoRentMe.Api.Services.InMemory;

public sealed class InMemoryAuthService : IAuthService
{
    private static readonly List<AuthResponse> Users = [];

    public Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken)
    {
        var user = new AuthResponse(Users.Count + 1, request.Name, request.Email, "CUSTOMER", Token: null);
        Users.Add(user);
        return Task.FromResult(user);
    }

    public Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken)
    {
        var user = Users.FirstOrDefault(existing => existing.Email.Equals(request.Email, StringComparison.OrdinalIgnoreCase));
        return Task.FromResult(user);
    }

    public Task<AuthResponse?> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(Users.FirstOrDefault());
    }
}
