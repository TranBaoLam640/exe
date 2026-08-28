using DoRentMe.Api.Models;
using DoRentMe.Api.Services.Abstractions;

namespace DoRentMe.Api.Services.InMemory;

public sealed class InMemoryProductService : IProductService
{
    private static readonly IReadOnlyList<Product> Products =
    [
        new Product
        {
            Id = 1,
            Name = "Sample Ao Dai",
            Category = "ao-dai",
            Brand = "DoRentMe",
            Price1Day = 150000,
            Price3Day = 300000,
            Deposit = 500000,
            ImageUrl = null,
        },
    ];

    public Task<IReadOnlyList<Product>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult(Products);
    }

    public Task<Product?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return Task.FromResult(Products.FirstOrDefault(product => product.Id == id));
    }

    public Task<IReadOnlyList<Product>> SearchAsync(string query, CancellationToken cancellationToken)
    {
        var results = Products
            .Where(product => product.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Task.FromResult<IReadOnlyList<Product>>(results);
    }

    public Task<IReadOnlyList<Product>> GetByCategoryAsync(string category, CancellationToken cancellationToken)
    {
        var results = Products
            .Where(product => product.Category.Equals(category, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Task.FromResult<IReadOnlyList<Product>>(results);
    }
}
