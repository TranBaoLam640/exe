using DoRentMe.Api.Contracts.Shop;

namespace DoRentMe.Api.Services;

public interface IShopService
{
    Task<List<ShopReadResponse>> GetAllAsync(
        CancellationToken cancellationToken = default);

    Task<ShopReadResponse> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default);
}
