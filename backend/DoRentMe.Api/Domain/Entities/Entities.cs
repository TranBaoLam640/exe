using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Domain.Entities;

public abstract class Entity
{
    public int Id { get; set; }
}

public abstract class AuditableEntity : Entity
{
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public sealed class Role : Entity
{
    [MaxLength(50)] public string Code { get; set; } = string.Empty;
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(255)] public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class User : AuditableEntity
{
    public int RoleId { get; set; }
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(150)] public string Email { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    [MaxLength(255)] public string PasswordHash { get; set; } = string.Empty;
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UserAddress : AuditableEntity
{
    public int UserId { get; set; }
    [MaxLength(100)] public string ReceiverName { get; set; } = string.Empty;
    [MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [MaxLength(500)] public string AddressLine { get; set; } = string.Empty;
    [MaxLength(100)] public string? Ward { get; set; }
    [MaxLength(100)] public string? District { get; set; }
    [MaxLength(100)] public string? City { get; set; }
    [MaxLength(500)] public string? Note { get; set; }
    public bool IsDefault { get; set; }
}

public sealed class Shop : AuditableEntity
{
    [MaxLength(150)] public string Name { get; set; } = string.Empty;
    [MaxLength(20)] public string Phone { get; set; } = string.Empty;
    [MaxLength(150)] public string? Email { get; set; }
    [MaxLength(500)] public string Address { get; set; } = string.Empty;
    [MaxLength(100)] public string? Ward { get; set; }
    [MaxLength(100)] public string? District { get; set; }
    [MaxLength(100)] public string? City { get; set; }
    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(50)] public string? BankAccountNo { get; set; }
    [MaxLength(100)] public string? BankAccountName { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Category : AuditableEntity
{
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(120)] public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class Brand : AuditableEntity
{
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(120)] public string Slug { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}

public sealed class Product : AuditableEntity
{
    public int? ShopId { get; set; }
    public int OwnerUserId { get; set; }
    public int CategoryId { get; set; }
    public int? BrandId { get; set; }
    [MaxLength(200)] public string Name { get; set; } = string.Empty;
    [MaxLength(220)] public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    [Precision(18, 2)] public decimal Price1Day { get; set; }
    [Precision(18, 2)] public decimal Price3Day { get; set; }
    [Precision(18, 2)] public decimal ExtraDayPrice { get; set; }
    [Precision(18, 2)] public decimal? PriceTag { get; set; }
    [Precision(18, 2)] public decimal PriceDeposit { get; set; }
    [Precision(18, 2)] public decimal? PurchaseCost { get; set; }
    [Precision(18, 2)] public decimal CleaningCost { get; set; }
    [Precision(18, 2)] public decimal MaintenanceCost { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class ProductImage : Entity
{
    public int ProductId { get; set; }
    [MaxLength(500)] public string ImageUrl { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class ProductVariant : AuditableEntity
{
    public int ProductId { get; set; }
    [MaxLength(50)] public string Size { get; set; } = string.Empty;
    [MaxLength(80)] public string Color { get; set; } = string.Empty;
    [MaxLength(100)] public string? VariantCode { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class ProductInventoryItem : AuditableEntity
{
    public int ProductVariantId { get; set; }
    [MaxLength(100)] public string AssetCode { get; set; } = string.Empty;
    [MaxLength(50)] public string Condition { get; set; } = "GOOD";
    [MaxLength(50)] public string Status { get; set; } = "AVAILABLE";
    [MaxLength(500)] public string? Notes { get; set; }
    public DateTime? AcquiredAt { get; set; }
}

public sealed class Cart : AuditableEntity
{
    public int? UserId { get; set; }
    [MaxLength(100)] public string? SessionId { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "active";
}

public sealed class CartItem : AuditableEntity
{
    public int CartId { get; set; }
    public int ProductVariantId { get; set; }
    public int Quantity { get; set; } = 1;
    public DateOnly RentalStartDate { get; set; }
    public DateOnly RentalEndDate { get; set; }
}

public sealed class Order : AuditableEntity
{
    public int? ShopId { get; set; }
    [MaxLength(50)] public string OrderCode { get; set; } = string.Empty;
    public int? UserId { get; set; }
    [MaxLength(100)] public string CustomerName { get; set; } = string.Empty;
    [MaxLength(20)] public string CustomerPhone { get; set; } = string.Empty;
    [MaxLength(150)] public string? CustomerEmail { get; set; }
    [MaxLength(500)] public string ShippingAddress { get; set; } = string.Empty;
    [MaxLength(500)] public string? CustomerNote { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "pending_confirmation";
    [Precision(18, 2)] public decimal TotalRent { get; set; }
    [Precision(18, 2)] public decimal TotalDeposit { get; set; }
    [Precision(18, 2)] public decimal TotalDiscount { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Computed), Precision(18, 2)] public decimal TotalAmount { get; private set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool DeliveryConfirmed { get; set; }
    public DateTime? ReturnRequestedAt { get; set; }
}

public sealed class OrderItem : Entity
{
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public int ProductVariantId { get; set; }
    [MaxLength(200)] public string ProductNameSnapshot { get; set; } = string.Empty;
    [MaxLength(50)] public string SizeSnapshot { get; set; } = string.Empty;
    [MaxLength(80)] public string ColorSnapshot { get; set; } = string.Empty;
    public int Quantity { get; set; }
    [Precision(18, 2)] public decimal PricePerItem { get; set; }
    [Precision(18, 2)] public decimal DepositPerItem { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class RentalReservation : AuditableEntity
{
    public int OrderItemId { get; set; }
    public int ProductInventoryItemId { get; set; }
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "RESERVED";
}

public sealed class Payment : Entity
{
    public int OrderId { get; set; }
    [MaxLength(50)] public string Method { get; set; } = "bank_transfer";
    [MaxLength(50)] public string Status { get; set; } = "pending";
    [Precision(18, 2)] public decimal Amount { get; set; }
    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(50)] public string? BankAccountNo { get; set; }
    [MaxLength(100)] public string? BankAccountName { get; set; }
    [MaxLength(200)] public string? TransferContent { get; set; }
    [MaxLength(100)] public string? TransactionCode { get; set; }
    [MaxLength(150)] public string? ProviderTransactionId { get; set; }
    public DateTime? PaidAt { get; set; }
    public int? ConfirmedByUserId { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Shipment : AuditableEntity
{
    public int? ShopId { get; set; }
    public int OrderId { get; set; }
    [MaxLength(20)] public string Direction { get; set; } = "outbound";
    [MaxLength(50)] public string Provider { get; set; } = "SPX";
    [MaxLength(50)] public string ServiceType { get; set; } = "instant";
    [MaxLength(50)] public string Status { get; set; } = "pending";
    [MaxLength(100)] public string? TrackingCode { get; set; }
    [MaxLength(100)] public string? ProviderOrderCode { get; set; }
    [MaxLength(100)] public string SenderName { get; set; } = string.Empty;
    [MaxLength(20)] public string SenderPhone { get; set; } = string.Empty;
    [MaxLength(500)] public string SenderAddress { get; set; } = string.Empty;
    [MaxLength(100)] public string ReceiverName { get; set; } = string.Empty;
    [MaxLength(20)] public string ReceiverPhone { get; set; } = string.Empty;
    [MaxLength(500)] public string ReceiverAddress { get; set; } = string.Empty;
    [Precision(18, 2)] public decimal ShippingFee { get; set; }
    [Precision(18, 2)] public decimal CodAmount { get; set; }
    public DateTime? PickupTime { get; set; }
    public DateTime? EstimatedDeliveryTime { get; set; }
    public DateTime? DeliveredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public string? RawProviderResponse { get; set; }
}

public sealed class ShipmentTrackingEvent : Entity
{
    public int ShipmentId { get; set; }
    [MaxLength(50)] public string Status { get; set; } = string.Empty;
    [MaxLength(500)] public string? Message { get; set; }
    [MaxLength(255)] public string? Location { get; set; }
    [MaxLength(100)] public string? ProviderEventCode { get; set; }
    public DateTime? ProviderEventTime { get; set; }
    public string? RawEvent { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class OrderStatusHistory : Entity
{
    public int OrderId { get; set; }
    [MaxLength(50)] public string? OldStatus { get; set; }
    [MaxLength(50)] public string NewStatus { get; set; } = string.Empty;
    [MaxLength(500)] public string? Note { get; set; }
    public int? CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Refund : Entity
{
    public int OrderId { get; set; }
    public int? PaymentId { get; set; }
    [MaxLength(50)] public string Type { get; set; } = "deposit";
    [MaxLength(50)] public string Status { get; set; } = "pending";
    [Precision(18, 2)] public decimal Amount { get; set; }
    [MaxLength(500)] public string? Reason { get; set; }
    [MaxLength(100)] public string? BankName { get; set; }
    [MaxLength(50)] public string? BankAccountNo { get; set; }
    [MaxLength(100)] public string? BankAccountName { get; set; }
    [MaxLength(100)] public string? TransactionCode { get; set; }
    public int? RequestedByUserId { get; set; }
    public int? ProcessedByUserId { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

public sealed class ProductLike : Entity
{
    public int UserId { get; set; }
    public int ProductId { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Review : AuditableEntity
{
    public int UserId { get; set; }
    public int ProductId { get; set; }
    public int OrderItemId { get; set; }
    public int Rating { get; set; }
    [MaxLength(1000)] public string? Comment { get; set; }
    public bool IsApproved { get; set; } = true;
}

public sealed class ChatSession : AuditableEntity
{
    public int? UserId { get; set; }
    [MaxLength(100)] public string SessionId { get; set; } = string.Empty;
}

public sealed class ChatMessage : Entity
{
    public int ChatSessionId { get; set; }
    [MaxLength(20)] public string Role { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public sealed class TryOnRequest : Entity
{
    public int? UserId { get; set; }
    public int ProductId { get; set; }
    [MaxLength(100)] public string? RequestId { get; set; }
    [MaxLength(500)] public string UserImageUrl { get; set; } = string.Empty;
    [MaxLength(500)] public string GarmentImageUrl { get; set; } = string.Empty;
    [MaxLength(500)] public string? ResultImageUrl { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "pending";
    [MaxLength(500)] public string? ErrorMessage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public sealed class LoyaltyTransaction : Entity
{
    public int UserId { get; set; }
    public int? OrderId { get; set; }
    public int Points { get; set; }
    [MaxLength(50)] public string Type { get; set; } = string.Empty;
    [MaxLength(500)] public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public sealed class Voucher : AuditableEntity
{
    [MaxLength(50)] public string Code { get; set; } = string.Empty;
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(20)] public string DiscountType { get; set; } = string.Empty;
    [Precision(18, 2)] public decimal DiscountValue { get; set; }
    public int RequiredPoints { get; set; }
    [Precision(18, 2)] public decimal? MinOrderAmount { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class UserVoucher : Entity
{
    public int UserId { get; set; }
    public int VoucherId { get; set; }
    [MaxLength(50)] public string Status { get; set; } = "available";
    public DateTime AcquiredAt { get; set; }
    public DateTime? UsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
}

public sealed class ContactMessage : AuditableEntity
{
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    [MaxLength(150)] public string Email { get; set; } = string.Empty;
    [MaxLength(20)] public string? Phone { get; set; }
    [MaxLength(200)] public string? Subject { get; set; }
    public string Message { get; set; } = string.Empty;
    [MaxLength(50)] public string Status { get; set; } = "new";
}

public sealed class NewsArticle : AuditableEntity
{
    public int? AuthorId { get; set; }
    [MaxLength(255)] public string Title { get; set; } = string.Empty;
    [MaxLength(255)] public string Slug { get; set; } = string.Empty;
    [MaxLength(500)] public string? Description { get; set; }
    public string? Content { get; set; }
    [MaxLength(500)] public string? ImageUrl { get; set; }
    public DateTime? PublishedAt { get; set; }
    public bool IsPublished { get; set; }
}

public sealed class ProductMonthlyStat : Entity
{
    public int ProductId { get; set; }
    public int Year { get; set; }
    public int Month { get; set; }
    public int TotalOrders { get; set; }
    public int TotalQuantityRented { get; set; }
    [Precision(18, 2)] public decimal RentRevenue { get; set; }
    [Precision(18, 2)] public decimal DepositCollected { get; set; }
    [Precision(18, 2)] public decimal DepositRefunded { get; set; }
    [Precision(18, 2)] public decimal ShippingFee { get; set; }
    [Precision(18, 2)] public decimal DiscountAmount { get; set; }
    [Precision(18, 2)] public decimal CleaningCost { get; set; }
    [Precision(18, 2)] public decimal MaintenanceCost { get; set; }
    [DatabaseGenerated(DatabaseGeneratedOption.Computed), Precision(18, 2)] public decimal GrossProfit { get; private set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class Notification : Entity
{
    public int UserId { get; set; }
    [MaxLength(50)] public string Type { get; set; } = string.Empty;
    [MaxLength(200)] public string Title { get; set; } = string.Empty;
    [MaxLength(1000)] public string Message { get; set; } = string.Empty;
    [MaxLength(50)] public string? RelatedType { get; set; }
    public int? RelatedId { get; set; }
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
