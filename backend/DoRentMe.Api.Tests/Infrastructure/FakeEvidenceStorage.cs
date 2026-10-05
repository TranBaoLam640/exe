using System.Collections.Concurrent;
using DoRentMe.Api.Services;

namespace DoRentMe.Api.Tests.Infrastructure;

public class FakeEvidenceStorage : IEvidenceStorage
{
    public bool FailWrites { get; set; }
    private readonly ConcurrentDictionary<string, byte[]> _objects = new();
    public Task PutAsync(string key, byte[] bytes, string contentType, CancellationToken cancellationToken)
    {
        if (FailWrites) throw new DoRentMe.Api.Common.Exceptions.ApiException("EVIDENCE_STORAGE_UNAVAILABLE", "Test storage unavailable.", 503);
        _objects[key] = bytes.ToArray();
        return Task.CompletedTask;
    }
    public Task<byte[]> GetAsync(string key, CancellationToken cancellationToken) => Task.FromResult(_objects[key].ToArray());
}
