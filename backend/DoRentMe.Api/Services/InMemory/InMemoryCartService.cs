using DoRentMe.Api.Contracts;
using DoRentMe.Api.Models;
using DoRentMe.Api.Services.Abstractions;

namespace DoRentMe.Api.Services.InMemory;

public sealed class InMemoryCartService : ICartService
{
    private static readonly List<CartItem> Items = [];

    public Task<IReadOnlyList<CartItem>> GetAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<CartItem>>(Items);
    }

    public Task<CartItem> AddAsync(AddCartItemRequest request, CancellationToken cancellationToken)
    {
        var item = Items.FirstOrDefault(existing => existing.ProductId == request.ProductId);
        if (item is null)
        {
            item = new CartItem
            {
                Id = Items.Count + 1,
                ProductId = request.ProductId,
                ProductName = $"Product #{request.ProductId}",
                Quantity = request.Quantity,
                RentalStartDate = request.RentalStartDate,
                RentalEndDate = request.RentalEndDate,
            };
            Items.Add(item);
            return Task.FromResult(item);
        }

        item.Quantity += request.Quantity;
        return Task.FromResult(item);
    }

    public Task<CartItem?> UpdateAsync(int productId, UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        var item = Items.FirstOrDefault(existing => existing.ProductId == productId);
        if (item is not null)
        {
            item.Quantity = request.Quantity;
        }

        return Task.FromResult(item);
    }

    public Task<bool> RemoveAsync(int productId, CancellationToken cancellationToken)
    {
        var removed = Items.RemoveAll(item => item.ProductId == productId) > 0;
        return Task.FromResult(removed);
    }
}
