using System.Data;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Inspection;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ReturnInspectionService : IReturnInspectionService
{
    private static readonly string[] Conditions = ["NEW", "GOOD", "FAIR", "WORN", "DAMAGED"];
    private readonly DoRentMeDbContext _dbContext;

    public ReturnInspectionService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<ReturnInspectionResponse>> GetAdminInspectionsAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var inspections = await InspectionQuery().Where(item => item.OrderId == orderId).OrderBy(item => item.ProductInventoryItemId).ToListAsync(cancellationToken);
        return inspections.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<ReturnInspectionAssetResponse>> GetAdminAssetsAsync(int orderId, CancellationToken cancellationToken = default)
    {
        var links = await _dbContext.RentalReservations
            .AsNoTracking()
            .Include(item => item.OrderItem)
            .Include(item => item.ProductInventoryItem)
            .Where(item => item.OrderItem.OrderId == orderId)
            .OrderBy(item => item.ProductInventoryItemId)
            .ToListAsync(cancellationToken);
        var inspections = await InspectionQuery().Where(item => item.OrderId == orderId).ToListAsync(cancellationToken);
        return links.Select(link => new ReturnInspectionAssetResponse
        {
            ProductInventoryItemId = link.ProductInventoryItemId,
            OrderItemId = link.OrderItemId,
            AssetCode = link.ProductInventoryItem.AssetCode,
            ProductName = link.OrderItem.ProductNameSnapshot,
            Size = link.OrderItem.SizeSnapshot,
            Color = link.OrderItem.ColorSnapshot,
            OperationalStatus = link.ProductInventoryItem.Status,
            DepositAllocation = link.OrderItem.DepositPerItem,
            Inspection = inspections.FirstOrDefault(item => item.ProductInventoryItemId == link.ProductInventoryItemId) is { } inspection ? Map(inspection) : null
        }).GroupBy(item => item.ProductInventoryItemId).Select(group => group.First()).ToList();
    }

    public async Task<IReadOnlyList<ReturnInspectionResponse>> GetCustomerInspectionsAsync(int userId, int orderId, CancellationToken cancellationToken = default)
    {
        var ownsReturnedOrder = await _dbContext.Orders.AnyAsync(item => item.Id == orderId && item.UserId == userId && item.Status == "returned", cancellationToken);
        if (!ownsReturnedOrder) throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        var inspections = await InspectionQuery().Where(item => item.OrderId == orderId).OrderBy(item => item.ProductInventoryItemId).ToListAsync(cancellationToken);
        return inspections.Select(Map).ToList();
    }

    public async Task<ReturnInspectionResponse> GetAsync(int inspectionId, CancellationToken cancellationToken = default)
    {
        var inspection = await InspectionQuery().FirstOrDefaultAsync(item => item.Id == inspectionId, cancellationToken);
        if (inspection == null) throw NotFound(ErrorCodes.InspectionNotFound, "Inspection not found.");
        return Map(inspection);
    }

    public async Task<ReturnInspectionResponse> CreateAsync(int adminUserId, int orderId, ReturnInspectionRequest request, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.Orders.FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order == null) throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        if (order.Status != "returned") throw BusinessError(ErrorCodes.OrderNotReadyForInspection, "Only returned orders can be inspected.");

        var link = await FindReservationAsync(orderId, request.ProductInventoryItemId, cancellationToken);
        if (link == null) throw BusinessError(ErrorCodes.InventoryItemNotPartOfOrder, "Inventory item is not part of this order.");
        if (await _dbContext.ReturnInspections.AnyAsync(item => item.OrderId == orderId && item.ProductInventoryItemId == request.ProductInventoryItemId, cancellationToken))
            throw Conflict(ErrorCodes.InspectionAlreadyExists, "This inventory item has already been inspected for the order.");

        var values = ValidateRequest(request, link.OrderItem.DepositPerItem);
        var inspection = new ReturnInspection
        {
            OrderId = orderId,
            OrderItemId = link.OrderItemId,
            ProductInventoryItemId = link.ProductInventoryItemId,
            ConditionAfterReturn = values.Condition,
            HasDamage = values.HasDamage,
            DamageDescription = values.Description,
            RecommendedDeduction = values.Deduction,
            InspectorUserId = adminUserId,
            InspectedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        _dbContext.ReturnInspections.Add(inspection);
        ApplyCondition(link.ProductInventoryItem, values.Condition);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(await InspectionQuery().FirstAsync(item => item.Id == inspection.Id, cancellationToken));
    }

    public async Task<ReturnInspectionResponse> UpdateAsync(int adminUserId, int inspectionId, ReturnInspectionRequest request, CancellationToken cancellationToken = default)
    {
        var inspection = await _dbContext.ReturnInspections.Include(item => item.OrderItem).Include(item => item.ProductInventoryItem).FirstOrDefaultAsync(item => item.Id == inspectionId, cancellationToken);
        if (inspection == null) throw NotFound(ErrorCodes.InspectionNotFound, "Inspection not found.");
        if (await _dbContext.Refunds.AnyAsync(item => item.OrderId == inspection.OrderId && item.Type == "deposit" && item.Status == "completed", cancellationToken))
            throw Conflict(ErrorCodes.InspectionLockedAfterSettlement, "Inspection cannot be edited after deposit settlement is completed.");
        var values = ValidateRequest(request, inspection.OrderItem.DepositPerItem);
        inspection.ConditionAfterReturn = values.Condition;
        inspection.HasDamage = values.HasDamage;
        inspection.DamageDescription = values.Description;
        inspection.RecommendedDeduction = values.Deduction;
        inspection.InspectorUserId = adminUserId;
        inspection.InspectedAt = DateTime.UtcNow;
        inspection.UpdatedAt = DateTime.UtcNow;
        ApplyCondition(inspection.ProductInventoryItem, values.Condition);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return Map(await InspectionQuery().FirstAsync(item => item.Id == inspection.Id, cancellationToken));
    }

    public async Task<InspectionSummaryResponse> GetSummaryAsync(int orderId, bool requireComplete, CancellationToken cancellationToken = default)
    {
        var order = await _dbContext.Orders.AsNoTracking().FirstOrDefaultAsync(item => item.Id == orderId, cancellationToken);
        if (order == null) throw NotFound(ErrorCodes.OrderNotFound, "Order not found.");
        var assetLinks = await _dbContext.RentalReservations.Where(item => item.OrderItem.OrderId == orderId).Select(item => new { item.ProductInventoryItemId, item.OrderItem.DepositPerItem }).Distinct().ToListAsync(cancellationToken);
        var inspections = await _dbContext.ReturnInspections.Where(item => item.OrderId == orderId).ToListAsync(cancellationToken);
        var total = Math.Min(order.TotalDeposit, inspections.Sum(item => item.RecommendedDeduction));
        var summary = new InspectionSummaryResponse
        {
            TotalDeposit = order.TotalDeposit,
            TotalRecommendedDeduction = total,
            RecommendedRefund = order.TotalDeposit - total,
            RequiredAssetCount = assetLinks.Count,
            InspectedAssetCount = inspections.Select(item => item.ProductInventoryItemId).Distinct().Count(),
            IsComplete = assetLinks.All(link => inspections.Any(item => item.ProductInventoryItemId == link.ProductInventoryItemId))
        };
        if (requireComplete && !summary.IsComplete) throw BusinessError(ErrorCodes.InspectionRequiredBeforeSettlement, "Every rented physical asset must be inspected before deposit settlement.");
        return summary;
    }

    private async Task<RentalReservation?> FindReservationAsync(int orderId, int inventoryId, CancellationToken cancellationToken) => await _dbContext.RentalReservations.Include(item => item.OrderItem).Include(item => item.ProductInventoryItem).FirstOrDefaultAsync(item => item.ProductInventoryItemId == inventoryId && item.OrderItem.OrderId == orderId, cancellationToken);
    private IQueryable<ReturnInspection> InspectionQuery() => _dbContext.ReturnInspections.AsNoTracking().Include(item => item.OrderItem).Include(item => item.ProductInventoryItem);
    private static (string Condition, bool HasDamage, string? Description, decimal Deduction) ValidateRequest(ReturnInspectionRequest request, decimal maxDeduction)
    {
        var condition = request.ConditionAfterReturn.Trim().ToUpperInvariant();
        if (!Conditions.Contains(condition, StringComparer.Ordinal)) throw BusinessError(ErrorCodes.InvalidInspectionCondition, "Inspection condition is not supported.");
        var description = string.IsNullOrWhiteSpace(request.DamageDescription) ? null : request.DamageDescription.Trim();
        if (request.HasDamage && description == null) throw BusinessError(ErrorCodes.InvalidDamageAssessment, "Damage description is required when damage is found.");
        var deduction = request.HasDamage ? decimal.Round(request.RecommendedDeduction, 2) : 0;
        if (deduction < 0 || deduction > maxDeduction) throw BusinessError(ErrorCodes.InvalidDamageDeduction, "Recommended deduction exceeds the per-asset deposit allocation.");
        return (condition, request.HasDamage, description, deduction);
    }
    private static void ApplyCondition(ProductInventoryItem item, string condition) => item.Condition = condition;
    private static ReturnInspectionResponse Map(ReturnInspection item) => new() { Id = item.Id, OrderId = item.OrderId, OrderItemId = item.OrderItemId, ProductInventoryItemId = item.ProductInventoryItemId, AssetCode = item.ProductInventoryItem.AssetCode, ProductName = item.OrderItem.ProductNameSnapshot, Size = item.OrderItem.SizeSnapshot, Color = item.OrderItem.ColorSnapshot, OperationalStatus = item.ProductInventoryItem.Status, ConditionAfterReturn = item.ConditionAfterReturn, HasDamage = item.HasDamage, DamageDescription = item.DamageDescription, RecommendedDeduction = item.RecommendedDeduction, InspectedAt = item.InspectedAt, UpdatedAt = item.UpdatedAt };
    private static ApiException NotFound(string code, string message) => new(code, message, StatusCodes.Status404NotFound);
    private static ApiException BusinessError(string code, string message) => new(code, message, StatusCodes.Status400BadRequest);
    private static ApiException Conflict(string code, string message) => new(code, message, StatusCodes.Status409Conflict);
}
