using System.Net;
using DoRentMe.Api.Common.Extensions;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace DoRentMe.Api.Tests.Infrastructure;

public class R2ConfigurationTests
{
    [Fact]
    public void LocalDefaults_FindRepositoryFileAndPreserveExplicitConfiguration()
    {
        var root = Path.Combine(Path.GetTempPath(), "dorentme-r2-" + Guid.NewGuid().ToString("N"));
        var apiRoot = Path.Combine(root, "backend", "DoRentMe.Api");
        Directory.CreateDirectory(apiRoot);
        try
        {
            File.WriteAllText(Path.Combine(root, ".env.r2.local"), """
                # Existing asset uploader settings
                R2_ACCOUNT_ID=local-account
                R2_ACCESS_KEY_ID="local-key"
                R2_SECRET_ACCESS_KEY='local-secret'
                R2_BUCKET=dorentme-assets # shared bucket
                R2_PUBLIC_BASE_URL=https://assets.example.test
                UNRELATED_SECRET=do-not-load
                """);
            var configuration = new ConfigurationManager();
            configuration.AddInMemoryCollection(new Dictionary<string, string?> { ["R2_ACCOUNT_ID"] = "hosting-account" });

            configuration.AddLocalR2Defaults(apiRoot);

            Assert.Equal("hosting-account", configuration["R2_ACCOUNT_ID"]);
            Assert.Equal("local-key", configuration["R2_ACCESS_KEY_ID"]);
            Assert.Equal("local-secret", configuration["R2_SECRET_ACCESS_KEY"]);
            Assert.Equal("dorentme-assets", configuration["R2_BUCKET"]);
            Assert.Null(configuration["R2_PUBLIC_BASE_URL"]);
            Assert.Null(configuration["UNRELATED_SECRET"]);
            Assert.Null(configuration["R2_EVIDENCE_BUCKET"]);
        }
        finally { Directory.Delete(root, recursive: true); }
    }

    [Theory]
    [InlineData("evidence/123/return/photo-id")]
    [InlineData("evidence/123/refund-456/photo-id")]
    public async Task Storage_UsesExistingAssetBucketForUploadAndRead(string key)
    {
        using var handler = new RecordingHandler();
        using var client = new HttpClient(handler);
        var configuration = new ConfigurationManager();
        configuration.AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["R2_ACCOUNT_ID"] = "test-account",
            ["R2_ACCESS_KEY_ID"] = "test-key",
            ["R2_SECRET_ACCESS_KEY"] = "test-secret",
            ["R2_BUCKET"] = "dorentme-assets"
        });
        var storage = new R2EvidenceStorage(client, configuration);
        await storage.PutAsync(key, [1, 2, 3], "image/png", CancellationToken.None);
        var bytes = await storage.GetAsync(key, CancellationToken.None);

        Assert.Equal(new byte[] { 1, 2, 3 }, bytes);
        Assert.Equal(new[] { HttpMethod.Put, HttpMethod.Get }, handler.Methods);
        Assert.All(handler.Urls, url => Assert.Equal($"https://test-account.r2.cloudflarestorage.com/dorentme-assets/{key}", url));
    }

    [Fact]
    public async Task Storage_MissingConfigurationDoesNotSendRequest()
    {
        using var handler = new RecordingHandler();
        using var client = new HttpClient(handler);
        var storage = new R2EvidenceStorage(client, new ConfigurationManager());
        await Assert.ThrowsAsync<ApiException>(() => storage.PutAsync("evidence/test", [1], "image/png", CancellationToken.None));
        Assert.Empty(handler.Urls);
    }

    private class RecordingHandler : HttpMessageHandler
    {
        public List<string> Urls { get; } = new();
        public List<HttpMethod> Methods { get; } = new();
        private byte[] _bytes = [];
        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Urls.Add(request.RequestUri!.AbsoluteUri);
            Methods.Add(request.Method);
            Assert.True(request.Headers.NonValidated.TryGetValues("Authorization", out var authorization));
            Assert.StartsWith("AWS4-HMAC-SHA256 Credential=test-key/", authorization.ToString());
            if (request.Method == HttpMethod.Put)
            {
                Assert.Equal("image/png", request.Content!.Headers.ContentType!.MediaType);
                _bytes = await request.Content.ReadAsByteArrayAsync(cancellationToken);
            }
            return new HttpResponseMessage(HttpStatusCode.OK) { Content = new ByteArrayContent(_bytes) };
        }
    }
}
