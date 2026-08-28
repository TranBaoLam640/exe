using DoRentMe.Api.Contracts;
using DoRentMe.Api.Models;
using DoRentMe.Api.Services.Abstractions;

namespace DoRentMe.Api.Services.InMemory;

public sealed class InMemoryOrderService : IOrderService
{
    private static readonly List<Order> Orders = [];

    public Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken cancellationToken)
    {
        return Task.FromResult<IReadOnlyList<Order>>(Orders);
    }

    public Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        return Task.FromResult(Orders.FirstOrDefault(order => order.Id == id));
    }

    public Task<Order> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken)
    {
        var order = new Order
        {
            Id = Orders.Count + 1,
            OrderCode = $"DRM-{DateTime.UtcNow:yyyyMMddHHmmss}",
            CustomerName = request.CustomerName,
            CustomerPhone = request.CustomerPhone,
            CustomerEmail = request.CustomerEmail,
            ShippingAddress = request.ShippingAddress,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
        };

        Orders.Add(order);
        return Task.FromResult(order);
    }

    public Task<bool> CancelAsync(int id, CancellationToken cancellationToken)
    {
        var order = Orders.FirstOrDefault(existing => existing.Id == id);
        if (order is null)
        {
            return Task.FromResult(false);
        }

        order.Status = "cancelled";
        return Task.FromResult(true);
    }
}
