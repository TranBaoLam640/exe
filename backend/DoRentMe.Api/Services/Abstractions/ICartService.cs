using DoRentMe.Api.Contracts;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services.Abstractions;

public interface ICartService
{
    Task<IReadOnlyList<CartItem>> GetAsync(CancellationToken cancellationToken);
    Task<CartItem> AddAsync(AddCartItemRequest request, CancellationToken cancellationToken);
    Task<CartItem?> UpdateAsync(int productId, UpdateCartItemRequest request, CancellationToken cancellationToken);
    Task<bool> RemoveAsync(int productId, CancellationToken cancellationToken);
}
