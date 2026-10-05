using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using DoRentMe.Api.Common.Exceptions;

namespace DoRentMe.Api.Services;

public class R2EvidenceStorage(HttpClient client, IConfiguration configuration) : IEvidenceStorage
{
    public async Task PutAsync(string key, byte[] bytes, string contentType, CancellationToken cancellationToken)
    {
        using var request = SignedRequest(HttpMethod.Put, key, bytes);
        request.Content = new ByteArrayContent(bytes);
        request.Content.Headers.ContentType = new(contentType);
        using var response = await client.SendAsync(request, cancellationToken);
        CheckResponse(response);
    }

    public async Task<byte[]> GetAsync(string key, CancellationToken cancellationToken)
    {
        using var request = SignedRequest(HttpMethod.Get, key, []);
        using var response = await client.SendAsync(request, cancellationToken);
        CheckResponse(response);
        return await response.Content.ReadAsByteArrayAsync(cancellationToken);
    }

    private HttpRequestMessage SignedRequest(HttpMethod method, string key, byte[] payload)
    {
        string Setting(string name) => configuration[$"R2_{name}"] is { Length: > 0 } value
            ? value : throw new ApiException("EVIDENCE_STORAGE_UNAVAILABLE", "Evidence storage is not configured.", 503);
        var account = Setting("ACCOUNT_ID");
        var bucket = Setting("EVIDENCE_BUCKET");
        var accessKey = Setting("ACCESS_KEY_ID");
        var secret = Setting("SECRET_ACCESS_KEY");
        var host = $"{account}.r2.cloudflarestorage.com";
        var path = "/" + string.Join("/", new[] { bucket }.Concat(key.Split('/')).Select(Uri.EscapeDataString));
        var now = DateTime.UtcNow;
        var date = now.ToString("yyyyMMdd", CultureInfo.InvariantCulture);
        var timestamp = now.ToString("yyyyMMddTHHmmssZ", CultureInfo.InvariantCulture);
        var hash = Hex(SHA256.HashData(payload));
        const string headers = "host;x-amz-content-sha256;x-amz-date";
        var canonical = $"{method.Method}\n{path}\n\nhost:{host}\nx-amz-content-sha256:{hash}\nx-amz-date:{timestamp}\n\n{headers}\n{hash}";
        var scope = $"{date}/auto/s3/aws4_request";
        var toSign = $"AWS4-HMAC-SHA256\n{timestamp}\n{scope}\n{Hex(SHA256.HashData(Encoding.UTF8.GetBytes(canonical)))}";
        var signingKey = Hmac(Hmac(Hmac(Hmac(Encoding.UTF8.GetBytes("AWS4" + secret), date), "auto"), "s3"), "aws4_request");
        var request = new HttpRequestMessage(method, $"https://{host}{path}");
        request.Headers.Add("x-amz-date", timestamp);
        request.Headers.Add("x-amz-content-sha256", hash);
        request.Headers.TryAddWithoutValidation("Authorization", $"AWS4-HMAC-SHA256 Credential={accessKey}/{scope}, SignedHeaders={headers}, Signature={Hex(Hmac(signingKey, toSign))}");
        return request;
    }

    private static byte[] Hmac(byte[] key, string value) => HMACSHA256.HashData(key, Encoding.UTF8.GetBytes(value));
    private static string Hex(byte[] bytes) => Convert.ToHexString(bytes).ToLowerInvariant();
    private static void CheckResponse(HttpResponseMessage response)
    {
        if (!response.IsSuccessStatusCode)
            throw new ApiException("EVIDENCE_STORAGE_UNAVAILABLE", "Unable to access evidence storage. Please try again.", 503);
    }
}
