using System.IdentityModel.Tokens.Jwt;
using DoRentMe.Api.Common.Exceptions;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace DoRentMe.Api.Services;

public record GoogleIdentity(string Subject, string Email, string Name, bool CanLinkByEmail);

public interface IGoogleTokenValidator
{
    Task<GoogleIdentity> ValidateAsync(string idToken);
}

public class GoogleTokenValidator : IGoogleTokenValidator
{
    private readonly IConfiguration _configuration;
    private readonly IConfigurationManager<OpenIdConnectConfiguration> _metadata;

    public GoogleTokenValidator(IConfiguration configuration,
        IConfigurationManager<OpenIdConnectConfiguration> metadata)
    {
        _configuration = configuration;
        _metadata = metadata;
    }

    public async Task<GoogleIdentity> ValidateAsync(string idToken)
    {
        var clientId = _configuration["GoogleAuth:ClientId"]?.Trim();
        if (string.IsNullOrEmpty(clientId) || clientId.Contains("-demo."))
            throw new ApiException("GOOGLE_NOT_CONFIGURED", "Google sign-in is not configured.", 503);

        if (string.IsNullOrWhiteSpace(idToken))
            throw InvalidCredential();

        OpenIdConnectConfiguration metadata;
        try { metadata = await _metadata.GetConfigurationAsync(CancellationToken.None); }
        catch { throw new ApiException("GOOGLE_UNAVAILABLE", "Google sign-in is temporarily unavailable. Please try again.", 503); }

        var handler = new JwtSecurityTokenHandler { MapInboundClaims = false };
        try
        {
            var principal = handler.ValidateToken(idToken, new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidIssuers = new[] { "https://accounts.google.com", "accounts.google.com" },
                ValidateAudience = true,
                ValidAudience = clientId,
                ValidateLifetime = true,
                RequireExpirationTime = true,
                RequireSignedTokens = true,
                ValidateIssuerSigningKey = true,
                IssuerSigningKeys = metadata.SigningKeys,
                ValidAlgorithms = new[] { SecurityAlgorithms.RsaSha256 },
                ClockSkew = TimeSpan.FromSeconds(30)
            }, out _);
            var subject = principal.FindFirst("sub")?.Value;
            var email = principal.FindFirst("email")?.Value?.Trim().ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(subject) || subject.Length > 255 ||
                string.IsNullOrWhiteSpace(email) || email.Length > 150 ||
                !string.Equals(principal.FindFirst("email_verified")?.Value, "true", StringComparison.OrdinalIgnoreCase))
                throw InvalidCredential();

            var name = principal.FindFirst("name")?.Value?.Trim();
            if (string.IsNullOrEmpty(name)) name = email.Split('@')[0];
            // Only Google-managed addresses can safely link to an existing password account by email.
            var authoritative = email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase) ||
                !string.IsNullOrWhiteSpace(principal.FindFirst("hd")?.Value);
            return new GoogleIdentity(subject, email, name[..Math.Min(name.Length, 100)], authoritative);
        }
        catch (SecurityTokenSignatureKeyNotFoundException)
        {
            _metadata.RequestRefresh();
            throw InvalidCredential();
        }
        catch (SecurityTokenException) { throw InvalidCredential(); }
        catch (ArgumentException) { throw InvalidCredential(); }
    }

    private static ApiException InvalidCredential() =>
        new("INVALID_GOOGLE_CREDENTIAL", "Google credential is invalid or expired. Please sign in again.", 401);
}
