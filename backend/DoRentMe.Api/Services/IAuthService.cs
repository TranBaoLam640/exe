using DoRentMe.Api.Contracts.Auth;

namespace DoRentMe.Api.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginWithGoogleAsync(GoogleLoginRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
}
