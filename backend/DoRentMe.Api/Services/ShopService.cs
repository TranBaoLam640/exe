using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Shop;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ShopService : IShopService
{
    private readonly DoRentMeDbContext _dbContext;

    public ShopService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ShopReadResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Shops
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new ShopReadResponse
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email,
                Ward = s.Ward,
                District = s.District,
                City = s.City
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ShopReadResponse> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var shop = await _dbContext.Shops
            .AsNoTracking()
            .Where(s => s.Id == id && s.IsActive)
            .Select(s => new ShopReadResponse
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email,
                Ward = s.Ward,
                District = s.District,
                City = s.City
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (shop == null)
        {
            throw new ApiException(
                ErrorCodes.ShopNotFound,
                "Shop not found.",
                StatusCodes.Status404NotFound);
        }

        return shop;
    }
}
