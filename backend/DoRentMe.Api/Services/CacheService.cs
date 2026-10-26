using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;

namespace DoRentMe.Api.Services;

public sealed class CacheService : ICacheService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly IDistributedCache _cache;
    private readonly ILogger<CacheService> _logger;

    public CacheService(IDistributedCache cache, ILogger<CacheService> logger)
    {
        _cache = cache;
        _logger = logger;
    }

    public async Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var bytes = await _cache.GetAsync(key, cancellationToken);
            if (bytes == null || bytes.Length == 0)
            {
                return default;
            }

            return JsonSerializer.Deserialize<T>(bytes, JsonOptions);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read cache for key {Key}", key);
            return default;
        }
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var bytes = JsonSerializer.SerializeToUtf8Bytes(value, JsonOptions);
            var options = new DistributedCacheEntryOptions();
            if (expiration.HasValue)
            {
                options.AbsoluteExpirationRelativeToNow = expiration.Value;
            }
            else
            {
                options.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            }

            await _cache.SetAsync(key, bytes, options, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to write cache for key {Key}", key);
        }
    }

    public async Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            await _cache.RemoveAsync(key, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to remove cache key {Key}", key);
        }
    }

    public async Task<long> IncrementAsync(string key, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentStr = await _cache.GetStringAsync(key, cancellationToken);
            long count = 0;
            if (!string.IsNullOrEmpty(currentStr) && long.TryParse(currentStr, out var existing))
            {
                count = existing;
            }

            count++;
            var options = new DistributedCacheEntryOptions();
            if (expiration.HasValue)
            {
                options.AbsoluteExpirationRelativeToNow = expiration.Value;
            }
            else
            {
                options.AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(30);
            }

            await _cache.SetStringAsync(key, count.ToString(), options, cancellationToken);
            return count;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to increment cache counter for key {Key}", key);
            return 1;
        }
    }

    public async Task<long> GetCountAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            var currentStr = await _cache.GetStringAsync(key, cancellationToken);
            if (!string.IsNullOrEmpty(currentStr) && long.TryParse(currentStr, out var count))
            {
                return count;
            }

            return 0;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to read cache counter for key {Key}", key);
            return 0;
        }
    }
}
