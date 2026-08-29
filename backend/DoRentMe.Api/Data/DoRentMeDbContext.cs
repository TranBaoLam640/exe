using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Data;

public class DoRentMeDbContext : DbContext
{
    public DoRentMeDbContext(DbContextOptions<DoRentMeDbContext> options)
        : base(options)
    {
    }

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
        base.OnModelCreating(modelBuilder);

        ConfigureIdentity(modelBuilder);
        ConfigureCatalog(modelBuilder);
        ConfigureCartAndRental(modelBuilder);
        ConfigureOrderAndFulfillment(modelBuilder);
        ConfigureEngagementAndAi(modelBuilder);
        ConfigureLoyaltyAndContent(modelBuilder);
        ConfigureIndexes(modelBuilder);
    }

    private static void ConfigureIdentity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasIndex(x => x.Name).IsUnique();

            entity.HasData(
                new Role { Id = 1, Code = "CUSTOMER", Name = "Customer", Description = "Customer who rents fashion products", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 2, Code = "LENDER", Name = "Lender", Description = "User who owns and lists rental products", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 3, Code = "ADMIN", Name = "Admin", Description = "Platform administrator", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", table =>
                table.HasCheckConstraint("CK_Users_LoyaltyPoints", "`LoyaltyPoints` >= 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.RoleId);

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.ToTable("UserAddresses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ReceiverName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.AddressLine).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Ward).HasMaxLength(100);
            entity.Property(x => x.District).HasMaxLength(100);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.Note).HasMaxLength(500);
            entity.HasIndex(x => x.UserId);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Addresses)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Shop>(entity =>
        {
            entity.ToTable("Shops");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150);
            entity.Property(x => x.Address).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Ward).HasMaxLength(100);
            entity.Property(x => x.District).HasMaxLength(100);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.HasIndex(x => x.IsActive);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasIndex(x => x.Slug).IsUnique();
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.ToTable("Brands");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasIndex(x => x.Slug).IsUnique();
        });
    }

    private static void ConfigureCatalog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products", table =>
            {
                table.HasCheckConstraint("CK_Products_Price1Day", "`Price1Day` >= 0");
                table.HasCheckConstraint("CK_Products_Price3Day", "`Price3Day` >= 0");
                table.HasCheckConstraint("CK_Products_ExtraDayPrice", "`ExtraDayPrice` >= 0");
                table.HasCheckConstraint("CK_Products_PriceTag", "`PriceTag` IS NULL OR `PriceTag` >= 0");
                table.HasCheckConstraint("CK_Products_PriceDeposit", "`PriceDeposit` >= 0");
                table.HasCheckConstraint("CK_Products_PurchaseCost", "`PurchaseCost` IS NULL OR `PurchaseCost` >= 0");
                table.HasCheckConstraint("CK_Products_CleaningCost", "`CleaningCost` >= 0");
                table.HasCheckConstraint("CK_Products_MaintenanceCost", "`MaintenanceCost` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Description).HasColumnType("longtext");
            entity.Property(x => x.Price1Day).HasPrecision(18, 2);
            entity.Property(x => x.Price3Day).HasPrecision(18, 2);
            entity.Property(x => x.ExtraDayPrice).HasPrecision(18, 2);
            entity.Property(x => x.PriceTag).HasPrecision(18, 2);
            entity.Property(x => x.PriceDeposit).HasPrecision(18, 2);
            entity.Property(x => x.PurchaseCost).HasPrecision(18, 2);
            entity.Property(x => x.CleaningCost).HasPrecision(18, 2);
            entity.Property(x => x.MaintenanceCost).HasPrecision(18, 2);
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.HasOne(x => x.Shop).WithMany(x => x.Products).HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.OwnerUser).WithMany(x => x.OwnedProducts).HasForeignKey(x => x.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany(x => x.Products).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Brand).WithMany(x => x.Products).HasForeignKey(x => x.BrandId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("ProductImages", table =>
                table.HasCheckConstraint("CK_ProductImages_SortOrder", "`SortOrder` >= 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();

            entity.Property<int?>("PrimaryProductId")
                .HasComputedColumnSql("CASE WHEN `IsPrimary` = 1 THEN `ProductId` ELSE NULL END", stored: true);
            entity.HasIndex("PrimaryProductId")
                .IsUnique()
                .HasDatabaseName("UX_ProductImages_OnePrimaryPerProduct");

            entity.HasOne(x => x.Product).WithMany(x => x.Images).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("ProductVariants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Size).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Color).HasMaxLength(80).IsRequired();
            entity.Property(x => x.VariantCode).HasMaxLength(100);
            entity.HasIndex(x => new { x.ProductId, x.Size, x.Color }).IsUnique();
            entity.HasIndex(x => x.VariantCode).IsUnique();

            entity.HasOne(x => x.Product).WithMany(x => x.Variants).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductInventoryItem>(entity =>
        {
            entity.ToTable("ProductInventoryItems", table =>
            {
                table.HasCheckConstraint("CK_ProductInventoryItems_Condition",
                    "`Condition` IN ('NEW','GOOD','FAIR','WORN','DAMAGED')");
                table.HasCheckConstraint("CK_ProductInventoryItems_Status",
                    "`Status` IN ('AVAILABLE','RESERVED','RENTED','CLEANING','MAINTENANCE','DAMAGED','LOST','RETIRED')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.AssetCode).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => x.AssetCode).IsUnique();
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.ProductVariant).WithMany(x => x.InventoryItems).HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCartAndRental(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("Carts", table =>
            {
                table.HasCheckConstraint("CK_Carts_UserOrSession", "`UserId` IS NOT NULL OR `SessionId` IS NOT NULL");
                table.HasCheckConstraint("CK_Carts_Status", "`Status` IN ('active','ordered','abandoned')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SessionId).HasMaxLength(100);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();

            entity.Property<int?>("ActiveUserId")
                .HasComputedColumnSql("CASE WHEN `Status` = 'active' THEN `UserId` ELSE NULL END", stored: true);
            entity.Property<string?>("ActiveSessionId")
                .HasMaxLength(100)
                .HasComputedColumnSql("CASE WHEN `Status` = 'active' THEN `SessionId` ELSE NULL END", stored: true);
            entity.HasIndex("ActiveUserId").IsUnique().HasDatabaseName("UX_Carts_Active_User");
            entity.HasIndex("ActiveSessionId").IsUnique().HasDatabaseName("UX_Carts_Active_Session");

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("CartItems", table =>
            {
                table.HasCheckConstraint("CK_CartItems_Quantity", "`Quantity` > 0");
                table.HasCheckConstraint("CK_CartItems_DateRange", "`RentalEndDate` > `RentalStartDate`");
            });
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.CartId, x.ProductVariantId, x.RentalStartDate, x.RentalEndDate }).IsUnique();

            entity.HasOne(x => x.Cart).WithMany(x => x.Items).HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductVariant).WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RentalReservation>(entity =>
        {
            entity.ToTable("RentalReservations", table =>
            {
                table.HasCheckConstraint("CK_RentalReservations_DateRange", "`EndDate` > `StartDate`");
                table.HasCheckConstraint("CK_RentalReservations_Status", "`Status` IN ('RESERVED','ACTIVE','COMPLETED','CANCELLED')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.ProductInventoryItemId, x.StartDate, x.EndDate, x.Status })
                .HasDatabaseName("IX_RentalReservations_Inventory_Date_Status");

            entity.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductInventoryItem).WithMany().HasForeignKey(x => x.ProductInventoryItemId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOrderAndFulfillment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders", table =>
            {
                table.HasCheckConstraint("CK_Orders_Status",
                    "`Status` IN ('pending_confirmation','shipping','delivered','return_requested','return_processing','returned','cancelled')");
                table.HasCheckConstraint("CK_Orders_TotalRent", "`TotalRent` >= 0");
                table.HasCheckConstraint("CK_Orders_TotalDeposit", "`TotalDeposit` >= 0");
                table.HasCheckConstraint("CK_Orders_TotalDiscount", "`TotalDiscount` >= 0");
                table.HasCheckConstraint("CK_Orders_DateRange", "`EndDate` > `StartDate`");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.OrderCode).HasMaxLength(50).IsRequired();
            entity.Property(x => x.CustomerName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.CustomerPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.CustomerEmail).HasMaxLength(150);
            entity.Property(x => x.ShippingAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.CustomerNote).HasMaxLength(500);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TotalRent).HasPrecision(18, 2);
            entity.Property(x => x.TotalDeposit).HasPrecision(18, 2);
            entity.Property(x => x.TotalDiscount).HasPrecision(18, 2);
            entity.Property(x => x.TotalAmount)
                .HasPrecision(18, 2)
                .HasComputedColumnSql("(`TotalRent` + `TotalDeposit` - `TotalDiscount`)", stored: true);
            entity.HasIndex(x => x.OrderCode).IsUnique();

            entity.HasOne(x => x.Shop).WithMany().HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems", table =>
            {
                table.HasCheckConstraint("CK_OrderItems_Quantity", "`Quantity` > 0");
                table.HasCheckConstraint("CK_OrderItems_PricePerItem", "`PricePerItem` >= 0");
                table.HasCheckConstraint("CK_OrderItems_DepositPerItem", "`DepositPerItem` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ProductNameSnapshot).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SizeSnapshot).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ColorSnapshot).HasMaxLength(80).IsRequired();
            entity.Property(x => x.PricePerItem).HasPrecision(18, 2);
            entity.Property(x => x.DepositPerItem).HasPrecision(18, 2);

            entity.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductVariant).WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments", table =>
            {
                table.HasCheckConstraint("CK_Payments_Amount", "`Amount` >= 0");
                table.HasCheckConstraint("CK_Payments_Status", "`Status` IN ('pending','paid','failed','refunded','cancelled')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Method).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.Property(x => x.TransferContent).HasMaxLength(200);
            entity.Property(x => x.TransactionCode).HasMaxLength(100);
            entity.Property(x => x.ProviderTransactionId).HasMaxLength(150);
            entity.HasIndex(x => x.ProviderTransactionId).IsUnique();

            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ConfirmedByUser).WithMany().HasForeignKey(x => x.ConfirmedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.ToTable("Shipments", table =>
            {
                table.HasCheckConstraint("CK_Shipments_Direction", "`Direction` IN ('outbound','return')");
                table.HasCheckConstraint("CK_Shipments_Status",
                    "`Status` IN ('pending','created','assigned','picked_up','shipping','delivered','failed','cancelled','returning','returned')");
                table.HasCheckConstraint("CK_Shipments_ShippingFee", "`ShippingFee` >= 0");
                table.HasCheckConstraint("CK_Shipments_CodAmount", "`CodAmount` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Direction).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Provider).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ServiceType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TrackingCode).HasMaxLength(100);
            entity.Property(x => x.ProviderOrderCode).HasMaxLength(100);
            entity.Property(x => x.SenderName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SenderPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.SenderAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ReceiverName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ReceiverPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.ReceiverAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ShippingFee).HasPrecision(18, 2);
            entity.Property(x => x.CodAmount).HasPrecision(18, 2);
            entity.Property(x => x.RawProviderResponse).HasColumnType("longtext");

            entity.HasOne(x => x.Shop).WithMany().HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShipmentTrackingEvent>(entity =>
        {
            entity.ToTable("ShipmentTrackingEvents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(500);
            entity.Property(x => x.Location).HasMaxLength(255);
            entity.Property(x => x.ProviderEventCode).HasMaxLength(100);
            entity.Property(x => x.RawEvent).HasColumnType("longtext");

            entity.HasOne(x => x.Shipment).WithMany(x => x.TrackingEvents).HasForeignKey(x => x.ShipmentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistory");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.OldStatus).HasMaxLength(50);
            entity.Property(x => x.NewStatus).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(500);

            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Refund>(entity =>
        {
            entity.ToTable("Refunds", table =>
            {
                table.HasCheckConstraint("CK_Refunds_Type", "`Type` IN ('deposit','order_cancel','compensation','other')");
                table.HasCheckConstraint("CK_Refunds_Status", "`Status` IN ('pending','processing','completed','rejected','cancelled')");
                table.HasCheckConstraint("CK_Refunds_Amount", "`Amount` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.Property(x => x.TransactionCode).HasMaxLength(100);

            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Payment).WithMany().HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.RequestedByUser).WithMany().HasForeignKey(x => x.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProcessedByUser).WithMany().HasForeignKey(x => x.ProcessedByUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEngagementAndAi(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductLike>(entity =>
        {
            entity.ToTable("ProductLikes");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("Reviews", table =>
                table.HasCheckConstraint("CK_Reviews_Rating", "`Rating` BETWEEN 1 AND 5"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Comment).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.OrderItemId }).IsUnique();

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("ChatSessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SessionId).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.SessionId).IsUnique();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages", table =>
                table.HasCheckConstraint("CK_ChatMessages_Role", "`Role` IN ('user','model','system')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Role).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Message).HasColumnType("longtext").IsRequired();
            entity.HasOne(x => x.ChatSession).WithMany(x => x.Messages).HasForeignKey(x => x.ChatSessionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TryOnRequest>(entity =>
        {
            entity.ToTable("TryOnRequests", table =>
                table.HasCheckConstraint("CK_TryOnRequests_Status", "`Status` IN ('pending','processing','completed','failed')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RequestId).HasMaxLength(100);
            entity.Property(x => x.UserImageUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.GarmentImageUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ResultImageUrl).HasMaxLength(500);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ErrorMessage).HasMaxLength(500);
            entity.HasIndex(x => x.RequestId).IsUnique();

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureLoyaltyAndContent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.ToTable("LoyaltyTransactions", table =>
                table.HasCheckConstraint("CK_LoyaltyTransactions_Type", "`Type` IN ('earn','redeem','adjust')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(500);

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.ToTable("Vouchers", table =>
            {
                table.HasCheckConstraint("CK_Vouchers_DiscountType", "`DiscountType` IN ('fixed','percent')");
                table.HasCheckConstraint("CK_Vouchers_DiscountValue", "`DiscountValue` >= 0");
                table.HasCheckConstraint("CK_Vouchers_RequiredPoints", "`RequiredPoints` >= 0");
                table.HasCheckConstraint("CK_Vouchers_MinOrderAmount", "`MinOrderAmount` IS NULL OR `MinOrderAmount` >= 0");
                table.HasCheckConstraint("CK_Vouchers_UsageLimit", "`UsageLimit` IS NULL OR `UsageLimit` > 0");
                table.HasCheckConstraint("CK_Vouchers_UsedCount", "`UsedCount` >= 0");
                table.HasCheckConstraint("CK_Vouchers_DateRange", "`EndAt` IS NULL OR `StartAt` IS NULL OR `EndAt` > `StartAt`");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.DiscountType).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DiscountValue).HasPrecision(18, 2);
            entity.Property(x => x.MinOrderAmount).HasPrecision(18, 2);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<UserVoucher>(entity =>
        {
            entity.ToTable("UserVouchers", table =>
                table.HasCheckConstraint("CK_UserVouchers_Status", "`Status` IN ('available','used','expired')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Voucher).WithMany(x => x.UserVouchers).HasForeignKey(x => x.VoucherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.ToTable("ContactMessages", table =>
                table.HasCheckConstraint("CK_ContactMessages_Status", "`Status` IN ('new','read','replied','closed')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.Subject).HasMaxLength(200);
            entity.Property(x => x.Message).HasColumnType("longtext").IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<NewsArticle>(entity =>
        {
            entity.ToTable("NewsArticles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.Content).HasColumnType("longtext");
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.HasOne(x => x.Author)
                .WithMany()
                .HasForeignKey(x => x.AuthorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProductMonthlyStat>(entity =>
        {
            entity.ToTable("ProductMonthlyStats", table =>
            {
                table.HasCheckConstraint("CK_ProductMonthlyStats_Year", "`Year` >= 2000");
                table.HasCheckConstraint("CK_ProductMonthlyStats_Month", "`Month` BETWEEN 1 AND 12");
                table.HasCheckConstraint("CK_ProductMonthlyStats_TotalOrders", "`TotalOrders` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_TotalQuantityRented", "`TotalQuantityRented` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_RentRevenue", "`RentRevenue` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DepositCollected", "`DepositCollected` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DepositRefunded", "`DepositRefunded` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_ShippingFee", "`ShippingFee` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DiscountAmount", "`DiscountAmount` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_CleaningCost", "`CleaningCost` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_MaintenanceCost", "`MaintenanceCost` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RentRevenue).HasPrecision(18, 2);
            entity.Property(x => x.DepositCollected).HasPrecision(18, 2);
            entity.Property(x => x.DepositRefunded).HasPrecision(18, 2);
            entity.Property(x => x.ShippingFee).HasPrecision(18, 2);
            entity.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            entity.Property(x => x.CleaningCost).HasPrecision(18, 2);
            entity.Property(x => x.MaintenanceCost).HasPrecision(18, 2);
            entity.Property(x => x.GrossProfit)
                .HasPrecision(18, 2)
                .HasComputedColumnSql("(`RentRevenue` - `ShippingFee` - `DiscountAmount` - `CleaningCost` - `MaintenanceCost`)", stored: true);
            entity.HasIndex(x => new { x.ProductId, x.Year, x.Month }).IsUnique();

            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", table =>
                table.HasCheckConstraint("CK_Notifications_Type", "`Type` IN ('order','payment','shipping','refund','voucher','system','tryon')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.RelatedType).HasMaxLength(50);
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Product>().HasIndex(x => x.OwnerUserId);
        modelBuilder.Entity<Product>().HasIndex(x => x.CategoryId);
        modelBuilder.Entity<Product>().HasIndex(x => x.BrandId);
        modelBuilder.Entity<Product>().HasIndex(x => x.IsActive);

        modelBuilder.Entity<ProductImage>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductVariant>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductInventoryItem>().HasIndex(x => x.ProductVariantId);

        modelBuilder.Entity<Cart>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Cart>().HasIndex(x => x.SessionId);
        modelBuilder.Entity<CartItem>().HasIndex(x => x.CartId);
        modelBuilder.Entity<CartItem>().HasIndex(x => x.ProductVariantId);

        modelBuilder.Entity<Order>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Order>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Order>().HasIndex(x => x.Status);
        modelBuilder.Entity<Order>().HasIndex(x => x.CreatedAt);

        modelBuilder.Entity<OrderItem>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<OrderItem>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<OrderItem>().HasIndex(x => x.ProductVariantId);

        modelBuilder.Entity<Payment>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<Payment>().HasIndex(x => x.Status);
        modelBuilder.Entity<Payment>().HasIndex(x => x.TransactionCode);

        modelBuilder.Entity<Shipment>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.Status);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.Direction);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.TrackingCode);
        modelBuilder.Entity<ShipmentTrackingEvent>().HasIndex(x => new { x.ShipmentId, x.CreatedAt });

        modelBuilder.Entity<OrderStatusHistory>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<OrderStatusHistory>().HasIndex(x => new { x.OrderId, x.CreatedAt });

        modelBuilder.Entity<Refund>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<Refund>().HasIndex(x => x.PaymentId);
        modelBuilder.Entity<Refund>().HasIndex(x => x.Status);

        modelBuilder.Entity<ProductLike>().HasIndex(x => x.UserId);
        modelBuilder.Entity<ProductLike>().HasIndex(x => x.ProductId);

        modelBuilder.Entity<Review>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Review>().HasIndex(x => new { x.ProductId, x.CreatedAt });
        modelBuilder.Entity<Review>().HasIndex(x => x.OrderItemId);

        modelBuilder.Entity<ChatSession>().HasIndex(x => x.UserId);
        modelBuilder.Entity<ChatMessage>().HasIndex(x => new { x.ChatSessionId, x.CreatedAt });

        modelBuilder.Entity<TryOnRequest>().HasIndex(x => new { x.UserId, x.CreatedAt });
        modelBuilder.Entity<TryOnRequest>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<TryOnRequest>().HasIndex(x => x.Status);

        modelBuilder.Entity<LoyaltyTransaction>().HasIndex(x => new { x.UserId, x.CreatedAt });
        modelBuilder.Entity<UserVoucher>().HasIndex(x => new { x.UserId, x.Status });
        modelBuilder.Entity<UserVoucher>().HasIndex(x => x.VoucherId);

        modelBuilder.Entity<ContactMessage>().HasIndex(x => x.Status);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.AuthorId);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.IsPublished);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.PublishedAt);

        modelBuilder.Entity<ProductMonthlyStat>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductMonthlyStat>().HasIndex(x => new { x.Year, x.Month });

        modelBuilder.Entity<Notification>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Notification>().HasIndex(x => new { x.UserId, x.IsRead });
        modelBuilder.Entity<Notification>().HasIndex(x => x.Type);
    }
}
