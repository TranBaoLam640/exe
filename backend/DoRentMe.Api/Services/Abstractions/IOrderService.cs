using DoRentMe.Api.Contracts;
using DoRentMe.Api.Models;

namespace DoRentMe.Api.Services.Abstractions;

public interface IOrderService
{
    Task<IReadOnlyList<Order>> GetAllAsync(CancellationToken cancellationToken);
    Task<Order?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<Order> CreateAsync(CreateOrderRequest request, CancellationToken cancellationToken);
    Task<bool> CancelAsync(int id, CancellationToken cancellationToken);
}
