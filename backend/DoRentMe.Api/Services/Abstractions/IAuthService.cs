using DoRentMe.Api.Contracts;

namespace DoRentMe.Api.Services.Abstractions;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken);
    Task<AuthResponse?> LoginAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<AuthResponse?> GetCurrentUserAsync(CancellationToken cancellationToken);
}
