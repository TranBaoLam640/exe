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
    private static readonly string[] ActiveStatuses = ["pending", "created", "assigned", "picked_up", "shipping", "returning"];
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
    private static readonly Dictionary<string, string[]> ReturnStatusTransitions = new(StringComparer.OrdinalIgnoreCase)
    {
        ["pending"] = ["picked_up", "cancelled"],
        ["picked_up"] = ["returning", "cancelled"],
        ["returning"] = ["returned", "failed"],
        ["failed"] = ["picked_up", "cancelled"],
        ["returned"] = [],
        ["cancelled"] = []
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

    public async Task<IReadOnlyList<ShipmentResponse>> GetAdminShipmentsByOrderAsync(int orderId, CancellationToken cancellationToken = default)
    {
        return (await ShipmentQuery().Where(item => item.OrderId == orderId).OrderBy(item => item.Direction).ThenByDescending(item => item.Id).ToListAsync(cancellationToken)).Select(Map).ToList();
    }

    public async Task<ShipmentResponse> GetCustomerShipmentAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var shipment = await ShipmentQuery().FirstOrDefaultAsync(item => item.OrderId == orderId && item.Order.UserId == userId, cancellationToken);
        return shipment == null
            ? throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.")
            : Map(shipment);
    }

    public async Task<IReadOnlyList<ShipmentResponse>> GetCustomerShipmentsAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var shipments = await ShipmentQuery().Where(item => item.OrderId == orderId && item.Order.UserId == userId)
            .OrderBy(item => item.Direction).ThenByDescending(item => item.Id).ToListAsync(cancellationToken);
        if (shipments.Count == 0) throw NotFound(ErrorCodes.ShipmentNotFound, "Shipment not found.");
        return shipments.Select(Map).ToList();
    }

    public async Task<ShipmentResponse> CreateAsync(int adminUserId, int orderId, ShipmentCreateRequest request, CancellationToken cancellationToken = default)
    {
        var order = await LoadOrderAsync(orderId, cancellationToken);
        if (order.Status != "pending_confirmation") throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "A shipment can only be created before dispatch.");
        await EnsureNoActiveShipmentAsync(orderId, "outbound", cancellationToken);
        if (order.Shop == null) throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "The order does not have a shop shipment origin.");
        var shipment = BuildShipment(order, request, "outbound");
        return await SaveNewShipmentAsync(shipment, cancellationToken);
    }

    public async Task<ShipmentResponse> CreateReturnAsync(int adminUserId, int orderId, ShipmentCreateRequest request, CancellationToken cancellationToken = default)
    {
        var order = await LoadOrderAsync(orderId, cancellationToken);
        if (order.Status != "return_requested") throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "A return shipment can only be created after a return is requested.");
        await EnsureNoActiveShipmentAsync(orderId, "return", cancellationToken);
        if (order.Shop == null) throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "The order does not have a shop return destination.");
        var shipment = BuildShipment(order, request, "return");
        shipment.SenderName = order.CustomerName;
        shipment.SenderPhone = order.CustomerPhone;
        shipment.SenderAddress = order.ShippingAddress;
        shipment.ReceiverName = order.Shop.Name;
        shipment.ReceiverPhone = order.Shop.Phone;
        shipment.ReceiverAddress = order.Shop.Address;
        return await SaveNewShipmentAsync(shipment, cancellationToken);
    }

    private async Task<Order> LoadOrderAsync(int orderId, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders.Include(item => item.Shop).FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order == null) throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        return order;
    }

    private async Task EnsureNoActiveShipmentAsync(int orderId, string direction, CancellationToken cancellationToken)
    {
        if (await _dbContext.Shipments.AnyAsync(item => item.OrderId == orderId && item.Direction == direction && ActiveStatuses.Contains(item.Status), cancellationToken))
            throw Conflict(ErrorCodes.ShipmentAlreadyExists, $"An active {direction} shipment already exists for this order.");
    }

    private static Shipment BuildShipment(Order order, ShipmentCreateRequest request, string direction)
    {
        if (order.Shop == null) throw BusinessError(ErrorCodes.OrderNotEligibleForShipment, "The order does not have a shop shipment origin.");
        return new Shipment
        {
            OrderId = order.Id,
            ShopId = order.ShopId,
            Direction = direction,
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
    }

    private async Task<ShipmentResponse> SaveNewShipmentAsync(Shipment shipment, CancellationToken cancellationToken)
    {
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
        var transitions = shipment.Direction == "return" ? ReturnStatusTransitions : StatusTransitions;
        if (!transitions.TryGetValue(shipment.Status, out var allowed) || !allowed.Contains(target, StringComparer.OrdinalIgnoreCase))
            throw Conflict(ErrorCodes.InvalidShipmentTransition, "Shipment status transition is not allowed.");

        shipment.Status = target;
        shipment.UpdatedAt = DateTime.UtcNow;
        if (target == "shipping") shipment.PickupTime ??= DateTime.UtcNow;
        if (target == "delivered") shipment.DeliveredAt = DateTime.UtcNow;
        if (target == "cancelled") shipment.CancelledAt = DateTime.UtcNow;
        AddEvent(shipment, target, Normalize(request.Note));

        if (shipment.Direction == "outbound" && target == "shipping" && shipment.Order.Status != "shipping")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "shipping", request.Note, cancellationToken);
        if (shipment.Direction == "outbound" && target == "delivered" && shipment.Order.Status != "delivered")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "delivered", request.Note, cancellationToken);
        if (shipment.Direction == "return" && target == "returning" && shipment.Order.Status != "return_processing")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "return_processing", request.Note, cancellationToken);
        if (shipment.Direction == "return" && target == "returned" && shipment.Order.Status != "returned")
            await _orderService.UpdateStatusFromShipmentAsync(shipment.OrderId, adminUserId, "returned", request.Note, cancellationToken);

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
        SenderName = item.SenderName, SenderPhone = item.SenderPhone, SenderAddress = item.SenderAddress,
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
