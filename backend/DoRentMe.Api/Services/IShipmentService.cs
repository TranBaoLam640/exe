using DoRentMe.Api.Contracts.Shipment;

namespace DoRentMe.Api.Services;

public interface IShipmentService
{
    Task<IReadOnlyList<ShipmentResponse>> GetAdminShipmentsAsync(ShipmentQueryRequest request, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> GetAdminShipmentAsync(int shipmentId, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> GetAdminShipmentByOrderAsync(int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ShipmentResponse>> GetAdminShipmentsByOrderAsync(int orderId, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> GetCustomerShipmentAsync(int userId, int orderId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<ShipmentResponse>> GetCustomerShipmentsAsync(int userId, int orderId, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> CreateAsync(int adminUserId, int orderId, ShipmentCreateRequest request, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> CreateReturnAsync(int adminUserId, int orderId, ShipmentCreateRequest request, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> UpdateAsync(int adminUserId, int shipmentId, ShipmentUpdateRequest request, CancellationToken cancellationToken = default);
    Task<ShipmentResponse> UpdateStatusAsync(int adminUserId, int shipmentId, ShipmentStatusRequest request, CancellationToken cancellationToken = default);
}
