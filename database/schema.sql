-- DoRentMe AI Fashion Rental Platform
-- Fresh schema for Microsoft SQL Server / Azure SQL Database.
-- This file creates an empty, normalized database schema.

-- 1. Roles
CREATE TABLE Roles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(255) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT UQ_Roles_Code UNIQUE (Code),
  CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);

-- 2. Users
CREATE TABLE Users (
  Id INT PRIMARY KEY IDENTITY(1,1),
  RoleId INT NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  PasswordHash NVARCHAR(255) NOT NULL,
  LoyaltyPoints INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id),
  CONSTRAINT UQ_Users_Email UNIQUE (Email),
  CONSTRAINT CK_Users_LoyaltyPoints CHECK (LoyaltyPoints >= 0)
);

-- 3. UserAddresses
CREATE TABLE UserAddresses (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  AddressLine NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  Note NVARCHAR(500) NULL,
  IsDefault BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- 4. Shops
CREATE TABLE Shops (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  Email NVARCHAR(150) NULL,
  Address NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL
);

-- 5. Categories
CREATE TABLE Categories (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Categories_Name UNIQUE (Name),
  CONSTRAINT UQ_Categories_Slug UNIQUE (Slug)
);

-- 6. Brands
CREATE TABLE Brands (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Brands_Name UNIQUE (Name),
  CONSTRAINT UQ_Brands_Slug UNIQUE (Slug)
);

-- 7. Products
CREATE TABLE Products (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OwnerUserId INT NOT NULL,
  CategoryId INT NOT NULL,
  BrandId INT NULL,
  Name NVARCHAR(200) NOT NULL,
  Slug NVARCHAR(220) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  Price1Day DECIMAL(18,2) NOT NULL,
  Price3Day DECIMAL(18,2) NOT NULL,
  ExtraDayPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
  PriceTag DECIMAL(18,2) NULL,
  PriceDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  PurchaseCost DECIMAL(18,2) NULL,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Products_OwnerUser FOREIGN KEY (OwnerUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
  CONSTRAINT FK_Products_Brands FOREIGN KEY (BrandId) REFERENCES Brands(Id),
  CONSTRAINT UQ_Products_Slug UNIQUE (Slug),
  CONSTRAINT CK_Products_Price1Day CHECK (Price1Day >= 0),
  CONSTRAINT CK_Products_Price3Day CHECK (Price3Day >= 0),
  CONSTRAINT CK_Products_ExtraDayPrice CHECK (ExtraDayPrice >= 0),
  CONSTRAINT CK_Products_PriceTag CHECK (PriceTag IS NULL OR PriceTag >= 0),
  CONSTRAINT CK_Products_PriceDeposit CHECK (PriceDeposit >= 0),
  CONSTRAINT CK_Products_PurchaseCost CHECK (PurchaseCost IS NULL OR PurchaseCost >= 0),
  CONSTRAINT CK_Products_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_Products_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 8. ProductImages
CREATE TABLE ProductImages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  ImageUrl NVARCHAR(500) NOT NULL,
  IsPrimary BIT NOT NULL DEFAULT 0,
  SortOrder INT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_ProductImages_SortOrder CHECK (SortOrder >= 0)
);

-- 9. ProductVariants
CREATE TABLE ProductVariants (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Size NVARCHAR(50) NOT NULL,
  Color NVARCHAR(80) NOT NULL,
  VariantCode NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductVariants_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductVariants_Product_Size_Color UNIQUE (ProductId, Size, Color)
);

-- 10. ProductInventoryItems
CREATE TABLE ProductInventoryItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductVariantId INT NOT NULL,
  AssetCode NVARCHAR(100) NOT NULL,
  Condition NVARCHAR(50) NOT NULL DEFAULT 'GOOD',
  Status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  Notes NVARCHAR(500) NULL,
  AcquiredAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductInventoryItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT UQ_ProductInventoryItems_AssetCode UNIQUE (AssetCode),
  CONSTRAINT CK_ProductInventoryItems_Condition CHECK (
    Condition IN ('NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED')
  ),
  CONSTRAINT CK_ProductInventoryItems_Status CHECK (
    Status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'CLEANING', 'MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED')
  )
);

-- 11. Carts
CREATE TABLE Carts (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'active',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Carts_UserOrSession CHECK (UserId IS NOT NULL OR SessionId IS NOT NULL),
  CONSTRAINT CK_Carts_Status CHECK (Status IN ('active', 'ordered', 'abandoned'))
);

-- 12. CartItems
CREATE TABLE CartItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  CartId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  Quantity INT NOT NULL DEFAULT 1,
  RentalStartDate DATE NOT NULL,
  RentalEndDate DATE NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES Carts(Id),
  CONSTRAINT FK_CartItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_CartItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_CartItems_DateRange CHECK (RentalEndDate > RentalStartDate),
  CONSTRAINT UQ_CartItems_EquivalentLine UNIQUE (CartId, ProductVariantId, RentalStartDate, RentalEndDate)
);

-- 13. Orders
CREATE TABLE Orders (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderCode NVARCHAR(50) NOT NULL,
  UserId INT NULL,
  CustomerName NVARCHAR(100) NOT NULL,
  CustomerPhone NVARCHAR(20) NOT NULL,
  CustomerEmail NVARCHAR(150) NULL,
  ShippingAddress NVARCHAR(500) NOT NULL,
  CustomerNote NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending_confirmation',
  TotalRent DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDiscount DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalAmount AS (TotalRent + TotalDeposit - TotalDiscount) PERSISTED,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  DeliveryConfirmed BIT NOT NULL DEFAULT 0,
  ReturnRequestedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Orders_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_Orders_OrderCode UNIQUE (OrderCode),
  CONSTRAINT CK_Orders_Status CHECK (
    Status IN ('pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned', 'cancelled')
  ),
  CONSTRAINT CK_Orders_TotalRent CHECK (TotalRent >= 0),
  CONSTRAINT CK_Orders_TotalDeposit CHECK (TotalDeposit >= 0),
  CONSTRAINT CK_Orders_TotalDiscount CHECK (TotalDiscount >= 0),
  CONSTRAINT CK_Orders_DateRange CHECK (EndDate > StartDate)
);

-- 14. OrderItems
CREATE TABLE OrderItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  ProductId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  ProductNameSnapshot NVARCHAR(200) NOT NULL,
  SizeSnapshot NVARCHAR(50) NOT NULL,
  ColorSnapshot NVARCHAR(80) NOT NULL,
  Quantity INT NOT NULL,
  PricePerItem DECIMAL(18,2) NOT NULL,
  DepositPerItem DECIMAL(18,2) NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_OrderItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_OrderItems_PricePerItem CHECK (PricePerItem >= 0),
  CONSTRAINT CK_OrderItems_DepositPerItem CHECK (DepositPerItem >= 0)
);

-- 15. RentalReservations
CREATE TABLE RentalReservations (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderItemId INT NOT NULL,
  ProductInventoryItemId INT NOT NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'RESERVED',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_RentalReservations_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT FK_RentalReservations_ProductInventoryItems FOREIGN KEY (ProductInventoryItemId) REFERENCES ProductInventoryItems(Id),
  CONSTRAINT CK_RentalReservations_DateRange CHECK (EndDate > StartDate),
  CONSTRAINT CK_RentalReservations_Status CHECK (
    Status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')
  )
);

-- 16. Payments
CREATE TABLE Payments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  Method NVARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransferContent NVARCHAR(200) NULL,
  TransactionCode NVARCHAR(100) NULL,
  ProviderTransactionId NVARCHAR(150) NULL,
  PaidAt DATETIME2 NULL,
  ConfirmedByUserId INT NULL,
  ConfirmedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Payments_ConfirmedByUser FOREIGN KEY (ConfirmedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
  CONSTRAINT CK_Payments_Status CHECK (
    Status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  )
);

-- 17. Shipments
CREATE TABLE Shipments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderId INT NOT NULL,
  Direction NVARCHAR(20) NOT NULL DEFAULT 'outbound',
  Provider NVARCHAR(50) NOT NULL DEFAULT 'SPX',
  ServiceType NVARCHAR(50) NOT NULL DEFAULT 'instant',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  TrackingCode NVARCHAR(100) NULL,
  ProviderOrderCode NVARCHAR(100) NULL,
  SenderName NVARCHAR(100) NOT NULL,
  SenderPhone NVARCHAR(20) NOT NULL,
  SenderAddress NVARCHAR(500) NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  ReceiverPhone NVARCHAR(20) NOT NULL,
  ReceiverAddress NVARCHAR(500) NOT NULL,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  CodAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  PickupTime DATETIME2 NULL,
  EstimatedDeliveryTime DATETIME2 NULL,
  DeliveredAt DATETIME2 NULL,
  CancelledAt DATETIME2 NULL,
  RawProviderResponse NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Shipments_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Shipments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_Shipments_Direction CHECK (Direction IN ('outbound', 'return')),
  CONSTRAINT CK_Shipments_Status CHECK (
    Status IN ('pending', 'created', 'assigned', 'picked_up', 'shipping', 'delivered', 'failed', 'cancelled', 'returning', 'returned')
  ),
  CONSTRAINT CK_Shipments_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_Shipments_CodAmount CHECK (CodAmount >= 0)
);

-- 18. ShipmentTrackingEvents
CREATE TABLE ShipmentTrackingEvents (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShipmentId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL,
  Message NVARCHAR(500) NULL,
  Location NVARCHAR(255) NULL,
  ProviderEventCode NVARCHAR(100) NULL,
  ProviderEventTime DATETIME2 NULL,
  RawEvent NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ShipmentTrackingEvents_Shipments FOREIGN KEY (ShipmentId) REFERENCES Shipments(Id)
);

-- 19. OrderStatusHistory
CREATE TABLE OrderStatusHistory (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  OldStatus NVARCHAR(50) NULL,
  NewStatus NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedByUserId INT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderStatusHistory_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);

-- 20. Refunds
CREATE TABLE Refunds (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  PaymentId INT NULL,
  Type NVARCHAR(50) NOT NULL DEFAULT 'deposit',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  Reason NVARCHAR(500) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransactionCode NVARCHAR(100) NULL,
  RequestedByUserId INT NULL,
  ProcessedByUserId INT NULL,
  RequestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ProcessedAt DATETIME2 NULL,

  CONSTRAINT FK_Refunds_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES Payments(Id),
  CONSTRAINT FK_Refunds_RequestedByUser FOREIGN KEY (RequestedByUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Refunds_ProcessedByUser FOREIGN KEY (ProcessedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Refunds_Type CHECK (Type IN ('deposit', 'order_cancel', 'compensation', 'other')),
  CONSTRAINT CK_Refunds_Status CHECK (Status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  CONSTRAINT CK_Refunds_Amount CHECK (Amount >= 0)
);

-- 21. ProductLikes
CREATE TABLE ProductLikes (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductLikes_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_ProductLikes_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductLikes_User_Product UNIQUE (UserId, ProductId)
);

-- 22. Reviews
CREATE TABLE Reviews (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  OrderItemId INT NOT NULL,
  Rating INT NOT NULL,
  Comment NVARCHAR(1000) NULL,
  IsApproved BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT UQ_Reviews_User_OrderItem UNIQUE (UserId, OrderItemId),
  CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);

-- 23. ChatSessions
CREATE TABLE ChatSessions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ChatSessions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_ChatSessions_SessionId UNIQUE (SessionId)
);

-- 24. ChatMessages
CREATE TABLE ChatMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ChatSessionId INT NOT NULL,
  Role NVARCHAR(20) NOT NULL,
  Message NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ChatMessages_ChatSessions FOREIGN KEY (ChatSessionId) REFERENCES ChatSessions(Id),
  CONSTRAINT CK_ChatMessages_Role CHECK (Role IN ('user', 'model', 'system'))
);

-- 25. TryOnRequests
CREATE TABLE TryOnRequests (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  ProductId INT NOT NULL,
  RequestId NVARCHAR(100) NULL,
  UserImageUrl NVARCHAR(500) NOT NULL,
  GarmentImageUrl NVARCHAR(500) NOT NULL,
  ResultImageUrl NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  ErrorMessage NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,
  CompletedAt DATETIME2 NULL,

  CONSTRAINT FK_TryOnRequests_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_TryOnRequests_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_TryOnRequests_Status CHECK (Status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 26. LoyaltyTransactions
CREATE TABLE LoyaltyTransactions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  OrderId INT NULL,
  Points INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_LoyaltyTransactions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_LoyaltyTransactions_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_LoyaltyTransactions_Type CHECK (Type IN ('earn', 'redeem', 'adjust'))
);

-- 27. Vouchers
CREATE TABLE Vouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  DiscountType NVARCHAR(20) NOT NULL,
  DiscountValue DECIMAL(18,2) NOT NULL,
  RequiredPoints INT NOT NULL DEFAULT 0,
  MinOrderAmount DECIMAL(18,2) NULL,
  StartAt DATETIME2 NULL,
  EndAt DATETIME2 NULL,
  UsageLimit INT NULL,
  UsedCount INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Vouchers_Code UNIQUE (Code),
  CONSTRAINT CK_Vouchers_DiscountType CHECK (DiscountType IN ('fixed', 'percent')),
  CONSTRAINT CK_Vouchers_DiscountValue CHECK (DiscountValue >= 0),
  CONSTRAINT CK_Vouchers_RequiredPoints CHECK (RequiredPoints >= 0),
  CONSTRAINT CK_Vouchers_MinOrderAmount CHECK (MinOrderAmount IS NULL OR MinOrderAmount >= 0),
  CONSTRAINT CK_Vouchers_UsageLimit CHECK (UsageLimit IS NULL OR UsageLimit > 0),
  CONSTRAINT CK_Vouchers_UsedCount CHECK (UsedCount >= 0),
  CONSTRAINT CK_Vouchers_DateRange CHECK (EndAt IS NULL OR StartAt IS NULL OR EndAt > StartAt)
);

-- 28. UserVouchers
CREATE TABLE UserVouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  VoucherId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'available',
  AcquiredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UsedAt DATETIME2 NULL,
  ExpiresAt DATETIME2 NULL,

  CONSTRAINT FK_UserVouchers_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_UserVouchers_Vouchers FOREIGN KEY (VoucherId) REFERENCES Vouchers(Id),
  CONSTRAINT CK_UserVouchers_Status CHECK (Status IN ('available', 'used', 'expired'))
);

-- 29. ContactMessages
CREATE TABLE ContactMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  Subject NVARCHAR(200) NULL,
  Message NVARCHAR(MAX) NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'new',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT CK_ContactMessages_Status CHECK (Status IN ('new', 'read', 'replied', 'closed'))
);

-- 30. NewsArticles
CREATE TABLE NewsArticles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  AuthorId INT NULL,
  Title NVARCHAR(255) NOT NULL,
  Slug NVARCHAR(255) NOT NULL,
  Description NVARCHAR(500) NULL,
  Content NVARCHAR(MAX) NULL,
  ImageUrl NVARCHAR(500) NULL,
  PublishedAt DATETIME2 NULL,
  IsPublished BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_NewsArticles_Users FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE SET NULL,
  CONSTRAINT UQ_NewsArticles_Slug UNIQUE (Slug)
);

-- 31. ProductMonthlyStats
CREATE TABLE ProductMonthlyStats (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Year INT NOT NULL,
  Month INT NOT NULL,
  TotalOrders INT NOT NULL DEFAULT 0,
  TotalQuantityRented INT NOT NULL DEFAULT 0,
  RentRevenue DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositCollected DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositRefunded DECIMAL(18,2) NOT NULL DEFAULT 0,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  GrossProfit AS (RentRevenue - ShippingFee - DiscountAmount - CleaningCost - MaintenanceCost) PERSISTED,
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductMonthlyStats_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductMonthlyStats_Product_Month UNIQUE (ProductId, Year, Month),
  CONSTRAINT CK_ProductMonthlyStats_Year CHECK (Year >= 2000),
  CONSTRAINT CK_ProductMonthlyStats_Month CHECK (Month BETWEEN 1 AND 12),
  CONSTRAINT CK_ProductMonthlyStats_TotalOrders CHECK (TotalOrders >= 0),
  CONSTRAINT CK_ProductMonthlyStats_TotalQuantityRented CHECK (TotalQuantityRented >= 0),
  CONSTRAINT CK_ProductMonthlyStats_RentRevenue CHECK (RentRevenue >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositCollected CHECK (DepositCollected >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositRefunded CHECK (DepositRefunded >= 0),
  CONSTRAINT CK_ProductMonthlyStats_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DiscountAmount CHECK (DiscountAmount >= 0),
  CONSTRAINT CK_ProductMonthlyStats_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_ProductMonthlyStats_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 32. Notifications
CREATE TABLE Notifications (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Title NVARCHAR(200) NOT NULL,
  Message NVARCHAR(1000) NOT NULL,
  RelatedType NVARCHAR(50) NULL,
  RelatedId INT NULL,
  IsRead BIT NOT NULL DEFAULT 0,
  ReadAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Notifications_Type CHECK (
    Type IN ('order', 'payment', 'shipping', 'refund', 'voucher', 'system', 'tryon')
  )
);

-- Filtered unique indexes.
CREATE UNIQUE INDEX UX_ProductImages_OnePrimaryPerProduct
ON ProductImages(ProductId)
WHERE IsPrimary = 1;

CREATE UNIQUE INDEX UX_Carts_Active_User
ON Carts(UserId)
WHERE UserId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Carts_Active_Session
ON Carts(SessionId)
WHERE SessionId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Payments_ProviderTransactionId
ON Payments(ProviderTransactionId)
WHERE ProviderTransactionId IS NOT NULL;

CREATE UNIQUE INDEX UX_ProductVariants_VariantCode
ON ProductVariants(VariantCode)
WHERE VariantCode IS NOT NULL;

CREATE UNIQUE INDEX UX_TryOnRequests_RequestId
ON TryOnRequests(RequestId)
WHERE RequestId IS NOT NULL;

-- General indexes.
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
CREATE INDEX IX_UserAddresses_UserId ON UserAddresses(UserId);
CREATE INDEX IX_Shops_IsActive ON Shops(IsActive);

CREATE INDEX IX_Products_ShopId ON Products(ShopId);
CREATE INDEX IX_Products_OwnerUserId ON Products(OwnerUserId);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_BrandId ON Products(BrandId);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);

CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(ProductId);
CREATE INDEX IX_ProductInventoryItems_ProductVariantId ON ProductInventoryItems(ProductVariantId);
CREATE INDEX IX_ProductInventoryItems_Status ON ProductInventoryItems(Status);

CREATE INDEX IX_Carts_UserId ON Carts(UserId);
CREATE INDEX IX_Carts_SessionId ON Carts(SessionId);
CREATE INDEX IX_CartItems_CartId ON CartItems(CartId);
CREATE INDEX IX_CartItems_ProductVariantId ON CartItems(ProductVariantId);

CREATE INDEX IX_Orders_ShopId ON Orders(ShopId);
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);

CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(ProductId);
CREATE INDEX IX_OrderItems_ProductVariantId ON OrderItems(ProductVariantId);

CREATE INDEX IX_RentalReservations_Inventory_Date_Status
ON RentalReservations(ProductInventoryItemId, StartDate, EndDate, Status);

CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
CREATE INDEX IX_Payments_Status ON Payments(Status);
CREATE INDEX IX_Payments_TransactionCode ON Payments(TransactionCode);

CREATE INDEX IX_Shipments_ShopId ON Shipments(ShopId);
CREATE INDEX IX_Shipments_OrderId ON Shipments(OrderId);
CREATE INDEX IX_Shipments_Status ON Shipments(Status);
CREATE INDEX IX_Shipments_Direction ON Shipments(Direction);
CREATE INDEX IX_Shipments_TrackingCode ON Shipments(TrackingCode);

CREATE INDEX IX_ShipmentTrackingEvents_ShipmentId_CreatedAt
ON ShipmentTrackingEvents(ShipmentId, CreatedAt);

CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(OrderId);
CREATE INDEX IX_OrderStatusHistory_OrderId_CreatedAt ON OrderStatusHistory(OrderId, CreatedAt);

CREATE INDEX IX_Refunds_OrderId ON Refunds(OrderId);
CREATE INDEX IX_Refunds_PaymentId ON Refunds(PaymentId);
CREATE INDEX IX_Refunds_Status ON Refunds(Status);

CREATE INDEX IX_ProductLikes_UserId ON ProductLikes(UserId);
CREATE INDEX IX_ProductLikes_ProductId ON ProductLikes(ProductId);

CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
CREATE INDEX IX_Reviews_ProductId_CreatedAt ON Reviews(ProductId, CreatedAt);
CREATE INDEX IX_Reviews_OrderItemId ON Reviews(OrderItemId);

CREATE INDEX IX_ChatSessions_UserId ON ChatSessions(UserId);
CREATE INDEX IX_ChatMessages_ChatSessionId_CreatedAt ON ChatMessages(ChatSessionId, CreatedAt);

CREATE INDEX IX_TryOnRequests_UserId_CreatedAt ON TryOnRequests(UserId, CreatedAt);
CREATE INDEX IX_TryOnRequests_ProductId ON TryOnRequests(ProductId);
CREATE INDEX IX_TryOnRequests_Status ON TryOnRequests(Status);

CREATE INDEX IX_LoyaltyTransactions_UserId_CreatedAt ON LoyaltyTransactions(UserId, CreatedAt);
CREATE INDEX IX_UserVouchers_UserId_Status ON UserVouchers(UserId, Status);
CREATE INDEX IX_UserVouchers_VoucherId ON UserVouchers(VoucherId);

CREATE INDEX IX_ContactMessages_Status ON ContactMessages(Status);
CREATE INDEX IX_NewsArticles_AuthorId ON NewsArticles(AuthorId);
CREATE INDEX IX_NewsArticles_IsPublished ON NewsArticles(IsPublished);
CREATE INDEX IX_NewsArticles_PublishedAt ON NewsArticles(PublishedAt);

CREATE INDEX IX_ProductMonthlyStats_ProductId ON ProductMonthlyStats(ProductId);
CREATE INDEX IX_ProductMonthlyStats_YearMonth ON ProductMonthlyStats(Year, Month);

CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
CREATE INDEX IX_Notifications_Type ON Notifications(Type);

-- Seed base roles.
INSERT INTO Roles (Code, Name, Description)
VALUES
('CUSTOMER', 'Customer', 'Customer who rents fashion products'),
('LENDER', 'Lender', 'User who owns and lists rental products'),
('ADMIN', 'Admin', 'Platform administrator');

-- Notes:
-- 1. Products.OwnerUserId must point to a user with the LENDER role. SQL Server cannot enforce this
--    role rule with a normal FK, so enforce it in application/service logic.
-- 2. RentalReservations prevents double booking through transactional application logic:
--    inside a transaction, find a candidate ProductInventoryItem, check for overlapping
--    active reservations where Status IN ('RESERVED', 'ACTIVE'), create the reservation, then commit.
--    The IX_RentalReservations_Inventory_Date_Status index supports that check, but a simple UNIQUE
--    constraint cannot fully prevent date-range overlap.
-- 3. ProductInventoryItems is the source of truth for stock counts. Do not maintain writable
--    TotalQuantity/AvailableQuantity columns on Products.
-- 4. ProductLikes and Reviews are the source of truth for likes/rating. Any displayed counts should
--    be calculated or maintained as documented caches outside this schema.
-- 5. OrderItems store snapshots so historical orders are stable even if products, variants, or prices change.
