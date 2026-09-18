using System.Data;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Shipment;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ShipmentService : IShipmentService
{
    private static readonly string[] TerminalStatuses = ["delivered", "cancelled", "returned"];
    private static readonly Dictionary<string, string[]> StatusTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pending"] = ["created", "shipping", "cancelled"],
        ["created"] = ["assigned", "picked_up", "shipping", "cancelled"],
        ["assigned"] = ["picked_up", "shipping", "cancelled"],
        ["picked_up"] = ["shipping", "delivered"],
        ["shipping"] = ["delivered", "failed"],
        ["failed"] = ["created", "cancelled"],
        ["delivered"] = [],
        ["cancelled"] = [],
        ["returning"] = ["returned"],
        ["returned"] = []
    };

    private readonly DoRentMeDbContext _dbContext;
    private readonly IOrderService _orderService;

    public ShipmentService(DoRentMeDbContext dbContext, IOrderService orderService)
    {
        _dbContext = dbContext;
        _orderService = orderService;
    }

    public async Task<IReadOnlyList<ShipmentResponse>> GetAdminShipmentsAsync(ShipmentQueryRequest request, CancellationToken cancellationToken = default)
    {
        var query = ShipmentQuery();
        if (!string.IsNullOrWhiteSpace(request.Status)) query = query.Where(item => item.Status == request.Status.Trim().ToLowerInvariant());
        if (!string.IsNullOrWhiteSpace(request.Provider)) query = query.Where(item => item.Provider == request.Provider.Trim());
        if (request.OrderId.HasValue) query = query.Where(item => item.OrderId == request.OrderId.Value);
        if (!string.IsNullOrWhiteSpace(request.TrackingCode)) query = query.Where(item => item.TrackingCode!.Contains(request.TrackingCode.Trim()));

        var shipments = await query.OrderByDescending(item => item.Id).ToListAsync(cancellationToken);
        return shipments.Select(Map).ToList();
    }

    public async Task<ShipmentResponse> GetAdminShipmentAsync(int shipmentId, CancellationToken cancellationToken = default)
    {
        var shipment = await ShipmentQuery().FirstOrDefaultAsync(item => item.Id == shipmentId, cancellationToken);
        return shipment == null
            ? throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.")
            : Map(shipment);
    }

    public async Task<ShipmentResponse> GetAdminShipmentByOrderAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var shipment = await ShipmentQuery().Where(item => item.OrderId == orderId && item.Direction == "outbound")
            .OrderByDescending(item => item.Id).FirstOrDefaultAsync(cancellationToken);
        return shipment == null
            ? throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.")
            : Map(shipment);
    }

    public async Task<ShipmentResponse> GetCustomerShipmentAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var shipment = await ShipmentQuery().FirstOrDefaultAsync(item => item.OrderId == orderId && item.Order.UserId == userId, cancellationToken);
        return shipment == null
            ? throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.")
            : Map(shipment);
    }

    public async Task<ShipmentResponse> CreateAsync(int adminUserId, int orderId, ShipmentCreateRequest request, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.Orders.Include(item => item.Shop).FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order == null) throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        if (order.Status != "pending_confirmation") throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "A shipment can only be created before dispatch.");
        if (await _dbContext.Shipments.AnyAsync(item => item.OrderId == orderId && item.Direction == "outbound" && !TerminalStatuses.Contains(item.Status), cancellationToken))
            throw Conflict(ErrorCodes.ShipmentAlreadyExists, "An active outbound shipment already exists for this order.");

        if (order.Shop == null) throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "The order does not have a shop shipment origin.");
        var shipment = new Shipment
        {
            OrderId = order.Id,
            ShopId = order.ShopId,
            Direction = "outbound",
            Provider = Normalize(request.Provider) ?? "manual",
            ServiceType = Normalize(request.ServiceType) ?? "manual",
            Status = "pending",
            TrackingCode = Normalize(request.TrackingCode),
            SenderName = order.Shop.Name,
            SenderPhone = order.Shop.Phone,
            SenderAddress = order.Shop.Address,
            ReceiverName = order.CustomerName,
            ReceiverPhone = order.CustomerPhone,
            ReceiverAddress = order.ShippingAddress,
            ShippingFee = request.ShippingFee,
            CodAmount = 0,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.Shipments.Add(shipment);
        await _dbContext.SaveChangesAsync(cancellationToken);
        AddEvent(shipment, "pending", "Shipment created manually.");
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(await ShipmentQuery().FirstAsync(item => item.Id == shipment.Id, cancellationToken));
    }

    public async Task<ShipmentResponse> UpdateAsync(int adminUserId, int shipmentId, ShipmentUpdateRequest request, CancellationToken cancellationToken = default)
    {
        var shipment = await _dbContext.Shipments.FirstOrDefaultAsync(item => item.Id == shipmentId, cancellationToken);
        if (shipment == null) throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.");
        if (TerminalStatuses.Contains(shipment.Status, StringComparer.OrdinalIgnoreCase)) throw BusinessError(ErrorCodes.ShipmentAlreadyDelivered, "Terminal shipment metadata cannot be changed.");
        shipment.Provider = Normalize(request.Provider) ?? shipment.Provider;
        shipment.ServiceType = Normalize(request.ServiceType) ?? shipment.ServiceType;
        shipment.TrackingCode = Normalize(request.TrackingCode);
        shipment.UpdatedAt = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(await ShipmentQuery().FirstAsync(item => item.Id == shipment.Id, cancellationToken));
    }

    public async Task<ShipmentResponse> UpdateStatusAsync(int adminUserId, int shipmentId, ShipmentStatusRequest request, CancellationToken cancellationToken = default)
    {
        var relational = _dbContext.Database.IsRelational();
        await using var transaction = relational ? await _dbContext.Database.BeginTransactionAsync(IsolationLevel.ReadCommitted, cancellationToken) : null;
        var shipment = await _dbContext.Shipments.Include(item => item.Order).FirstOrDefaultAsync(item => item.Id == shipmentId, cancellationToken);
        if (shipment == null) throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.");
        var target = request.Status.Trim().ToLowerInvariant();
        if (!StatusTransitions.TryGetValue(shipment.Status, out var allowed) || !allowed.Contains(target, StringComparer.OrdinalIgnoreCase))
            throw Conflict(ErrorCodes.InvalidShipmentTransition, "Shipment status transition is not allowed.");

        shipment.Status = target;
        shipment.UpdatedAt = DateTime.UtcNow;
        if (target == "shipping") shipment.PickupTime ??= DateTime.UtcNow;
        if (target == "delivered") shipment.DeliveredAt = DateTime.UtcNow;
        if (target == "cancelled") shipment.CancelledAt = DateTime.UtcNow;
        AddEvent(shipment, target, Normalize(request.Note));

        if (target == "shipping" && shipment.Order.Status != "shipping")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "shipping", request.Note, cancellationToken);
        if (target == "delivered" && shipment.Order.Status != "delivered")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "delivered", request.Note, cancellationToken);

        await _dbContext.SaveChangesAsync(cancellationToken);
        if (transaction != null) await transaction.CommitAsync(cancellationToken);
        return Map(await ShipmentQuery().FirstAsync(item => item.Id == shipment.Id, cancellationToken));
    }

    private IQueryable<Shipment> ShipmentQuery() => _dbContext.Shipments.AsNoTracking().Include(item => item.Order).Include(item => item.TrackingEvents);

    private static void AddEvent(Shipment shipment, string status, string? message)
    {
        shipment.TrackingEvents.Add(new ShipmentTrackingEvent { Status = status, Message = message, CreatedAt = DateTime.UtcNow });
    }

    private static ShipmentResponse Map(Shipment item) => new()
    {
        Id = item.Id, OrderId = item.OrderId, OrderCode = item.Order?.OrderCode, ShopId = item.ShopId, Direction = item.Direction,
        Provider = item.Provider, ServiceType = item.ServiceType, Status = item.Status, TrackingCode = item.TrackingCode,
        ReceiverName = item.ReceiverName, ReceiverPhone = item.ReceiverPhone, ReceiverAddress = item.ReceiverAddress,
        ShippingFee = item.ShippingFee, CodAmount = item.CodAmount, PickupTime = item.PickupTime,
        EstimatedDeliveryTime = item.EstimatedDeliveryTime, DeliveredAt = item.DeliveredAt, CancelledAt = item.CancelledAt,
        CreatedAt = item.CreatedAt, UpdatedAt = item.UpdatedAt,
        TrackingEvents = item.TrackingEvents.OrderBy(eventItem => eventItem.CreatedAt).ThenBy(eventItem => eventItem.Id).Select(eventItem => new ShipmentTrackingEventResponse
        {
            Id = eventItem.Id, Status = eventItem.Status, Message = eventItem.Message, Location = eventItem.Location,
            ProviderEventTime = eventItem.ProviderEventTime, CreatedAt = eventItem.CreatedAt
        }).ToList()
    };

    private static string? Normalize(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static ApiException NotFound(string code, string message) => new(code, message, StatusCodes.Status404NotFound);
    private static ApiException BusinessError(string code, string message) => new(code, message, StatusCodes.Status400BadRequest);
    private static ApiException Conflict(string code, string message) => new(code, message, StatusCodes.Status409Conflict);
}
