using DoRentMe.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Persistence;

public sealed class DoRentMeDbContext(DbContextOptions<DoRentMeDbContext> options) : DbContext(options)
{
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Shop> Shops => Set<Shop>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductInventoryItem> ProductInventoryItems => Set<ProductInventoryItem>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<RentalReservation> RentalReservations => Set<RentalReservation>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentTrackingEvent> ShipmentTrackingEvents => Set<ShipmentTrackingEvent>();
    public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<ProductLike> ProductLikes => Set<ProductLike>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<TryOnRequest> TryOnRequests => Set<TryOnRequest>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<UserVoucher> UserVouchers => Set<UserVoucher>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<ProductMonthlyStat> ProductMonthlyStats => Set<ProductMonthlyStat>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<Role>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<User>().HasIndex(x => x.Email).IsUnique();
        modelBuilder.Entity<Category>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Category>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<Brand>().HasIndex(x => x.Name).IsUnique();
        modelBuilder.Entity<Brand>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<Product>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<ProductVariant>().HasIndex(x => new { x.ProductId, x.Size, x.Color }).IsUnique();
        modelBuilder.Entity<ProductInventoryItem>().HasIndex(x => x.AssetCode).IsUnique();
        modelBuilder.Entity<CartItem>().HasIndex(x => new { x.CartId, x.ProductVariantId, x.RentalStartDate, x.RentalEndDate }).IsUnique();
        modelBuilder.Entity<Order>().HasIndex(x => x.OrderCode).IsUnique();
        modelBuilder.Entity<ProductLike>().HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
        modelBuilder.Entity<Review>().HasIndex(x => new { x.UserId, x.OrderItemId }).IsUnique();
        modelBuilder.Entity<ChatSession>().HasIndex(x => x.SessionId).IsUnique();
        modelBuilder.Entity<Voucher>().HasIndex(x => x.Code).IsUnique();
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.Slug).IsUnique();
        modelBuilder.Entity<ProductMonthlyStat>().HasIndex(x => new { x.ProductId, x.Year, x.Month }).IsUnique();
        modelBuilder.Entity<Order>().Property(x => x.TotalAmount).HasComputedColumnSql("[TotalRent] + [TotalDeposit] - [TotalDiscount]", stored: true);
        modelBuilder.Entity<ProductMonthlyStat>().Property(x => x.GrossProfit).HasComputedColumnSql("[RentRevenue] - [ShippingFee] - [DiscountAmount] - [CleaningCost] - [MaintenanceCost]", stored: true);
    }
}
