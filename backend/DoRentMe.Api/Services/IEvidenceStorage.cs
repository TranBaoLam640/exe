namespace DoRentMe.Api.Services;

public interface IEvidenceStorage
{
    Task PutAsync(string key, byte[] bytes, string contentType, CancellationToken cancellationToken);
    Task<byte[]> GetAsync(string key, CancellationToken cancellationToken);
}
