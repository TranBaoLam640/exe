using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoRentMe.Api.Tests.Orders;

public class OrderApiTests : IDisposable
{
    private const string CustomerEmail = "order-customer@example.com";
    private const string OtherCustomerEmail = "order-other@example.com";
    private const string LenderEmail = "order-lender@example.com";
    private const string OtherLenderEmail = "order-other-lender@example.com";
    private const string AdminEmail = "order-admin@example.com";
    private const string Password = "Password123!";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public OrderApiTests()
    {
        _factory = new CustomWebApplicationFactory();
        _client = _factory.CreateClient();
    }

    public void Dispose()
    {
        _client.Dispose();
        _factory.Dispose();
    }

    [Fact]
    public async Task Checkout_RequiresAuthAndRejectsEmptyCart()
    {
        var unauthorized = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        await LoginAsync(_client, CustomerEmail);
        var empty = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());
        Assert.Equal(HttpStatusCode.BadRequest, empty.StatusCode);
    }

    [Fact]
    public async Task Checkout_CreatesMultiShopOrdersReservationsHistoryAndSnapshots()
    {
        var first = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 2);
        var second = await SeedCatalogAsync(ownerEmail: OtherLenderEmail, stock: 1, price1Day: 120000, price3Day: 280000, extraDayPrice: 60000);
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, first.VariantId, quantity: 2, days: 1);
        await AddCartItemAsync(_client, second.VariantId, quantity: 1, days: 5);

        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());

        Assert.Equal(HttpStatusCode.Created, checkout.StatusCode);
        using var json = await ReadJsonAsync(checkout);
        var orders = json.RootElement.GetProperty("data").GetProperty("orders").EnumerateArray().ToList();
        Assert.Equal(2, orders.Count);
        Assert.All(orders, order => Assert.Equal("pending_confirmation", order.GetProperty("status").GetString()));

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var user = await dbContext.Users.SingleAsync(u => u.Email == CustomerEmail);
        var dbOrders = await dbContext.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == user.Id)
            .OrderBy(o => o.ShopId)
            .ToListAsync();

        Assert.Equal(2, dbOrders.Count);
        Assert.Equal(2, await dbContext.OrderStatusHistory.CountAsync(h => dbOrders.Select(o => o.Id).Contains(h.OrderId)));
        Assert.False(await dbContext.Carts.AnyAsync(c => c.UserId == user.Id && c.Status == "active"));

        var orderItems = dbOrders.SelectMany(o => o.Items).ToList();
        Assert.Contains(orderItems, item =>
            item.ProductVariantId == first.VariantId
            && item.Quantity == 2
            && item.RentalDays == 1
            && item.PricePerItem == 100000
            && item.LineSubtotal == 200000
            && item.DepositSubtotal == 600000);
        Assert.Contains(orderItems, item =>
            item.ProductVariantId == second.VariantId
            && item.Quantity == 1
            && item.RentalDays == 5
            && item.PricePerItem == 400000);

        var reservations = await dbContext.RentalReservations
            .Where(r => orderItems.Select(i => i.Id).Contains(r.OrderItemId))
            .ToListAsync();
        Assert.Equal(3, reservations.Count);
        Assert.Equal(3, reservations.Select(r => r.ProductInventoryItemId).Distinct().Count());
        Assert.All(reservations, reservation => Assert.Equal("RESERVED", reservation.Status));
    }

    [Fact]
    public async Task Checkout_FailureRollsBackOrdersReservationsVoucherAndKeepsCart()
    {
        var available = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        var blocked = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        await SeedVoucherAsync("ROLLBACK10", "fixed", 10000);
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, available.VariantId);
        await AddCartItemAsync(_client, blocked.VariantId);
        await SeedBlockingReservationAsync(blocked);

        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload("ROLLBACK10"));

        Assert.Equal(HttpStatusCode.Conflict, checkout.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var user = await dbContext.Users.SingleAsync(u => u.Email == CustomerEmail);
        Assert.Equal(0, await dbContext.Orders.CountAsync(o => o.UserId == user.Id));
        Assert.Equal(1, await dbContext.RentalReservations.CountAsync());
        Assert.Equal(0, (await dbContext.Vouchers.SingleAsync(v => v.Code == "ROLLBACK10")).UsedCount);
        Assert.True(await dbContext.Carts.AnyAsync(c => c.UserId == user.Id && c.Status == "active" && c.Items.Count == 2));
    }

    [Fact]
    public async Task Checkout_AllowsNonOverlappingFutureReservation()
    {
        var seed = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        await SeedBlockingReservationAsync(seed, start: new DateOnly(2026, 9, 20), end: new DateOnly(2026, 9, 23));
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, seed.VariantId, start: "2026-09-10", days: 3);

        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());

        Assert.Equal(HttpStatusCode.Created, checkout.StatusCode);
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal(2, await dbContext.RentalReservations.CountAsync());
    }

    [Fact]
    public async Task CustomerOrders_EnforcesOwnershipAndCancelReleasesReservation()
    {
        var seed = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, seed.VariantId);
        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());
        var orderId = await FirstOrderIdAsync(checkout);

        var mine = await _client.GetAsync($"/api/orders/{orderId}");
        Assert.Equal(HttpStatusCode.OK, mine.StatusCode);

        await LoginAsync(_client, OtherCustomerEmail);
        var other = await _client.GetAsync($"/api/orders/{orderId}");
        Assert.Equal(HttpStatusCode.NotFound, other.StatusCode);

        await LoginAsync(_client, CustomerEmail);
        var cancel = await _client.PostAsync($"/api/orders/{orderId}/cancel", null);
        var secondCancel = await _client.PostAsync($"/api/orders/{orderId}/cancel", null);

        Assert.Equal(HttpStatusCode.OK, cancel.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, secondCancel.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal("CANCELLED", (await dbContext.RentalReservations.SingleAsync()).Status);
        Assert.Equal(2, await dbContext.OrderStatusHistory.CountAsync(h => h.OrderId == orderId));
    }

    [Fact]
    public async Task ShopOwnerAndAdminStatusUpdates_AreAuthorizedAndWriteHistory()
    {
        var seed = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, seed.VariantId);
        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload());
        var orderId = await FirstOrderIdAsync(checkout);

        await LoginAsync(_client, OtherLenderEmail);
        var forbidden = await _client.PutAsJsonAsync($"/api/orders/{orderId}/status", new { status = "shipping" });
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        await LoginAsync(_client, LenderEmail);
        var shipping = await _client.PutAsJsonAsync($"/api/orders/{orderId}/status", new { status = "shipping", note = "Handed to carrier" });
        var invalid = await _client.PutAsJsonAsync($"/api/orders/{orderId}/status", new { status = "returned" });
        Assert.Equal(HttpStatusCode.OK, shipping.StatusCode);
        Assert.Equal(HttpStatusCode.Conflict, invalid.StatusCode);

        await LoginAsync(_client, AdminEmail);
        var delivered = await _client.PutAsJsonAsync($"/api/orders/{orderId}/status", new { status = "delivered" });
        Assert.Equal(HttpStatusCode.OK, delivered.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var order = await dbContext.Orders.SingleAsync(o => o.Id == orderId);
        Assert.Equal("delivered", order.Status);
        Assert.Equal(3, await dbContext.OrderStatusHistory.CountAsync(h => h.OrderId == orderId));
    }

    [Fact]
    public async Task Checkout_ConsumesVoucherOnlyOnSuccess()
    {
        var seed = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        await SeedVoucherAsync("ORDER50", "fixed", 50000, minOrderAmount: 100000);
        await LoginAsync(_client, CustomerEmail);
        await AddCartItemAsync(_client, seed.VariantId, days: 3);

        var checkout = await _client.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload("ORDER50"));

        Assert.Equal(HttpStatusCode.Created, checkout.StatusCode);
        using var json = await ReadJsonAsync(checkout);
        var order = json.RootElement.GetProperty("data").GetProperty("orders")[0];
        Assert.Equal(50000m, order.GetProperty("totals").GetProperty("discount").GetDecimal());

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal(1, (await dbContext.Vouchers.SingleAsync(v => v.Code == "ORDER50")).UsedCount);
    }

    [Fact]
    public async Task ConcurrentLastItemCheckout_AllowsExactlyOneSuccess()
    {
        var seed = await SeedCatalogAsync(ownerEmail: LenderEmail, stock: 1);
        var firstClient = _factory.CreateClient();
        var secondClient = _factory.CreateClient();
        await LoginAsync(firstClient, "order-race-a@example.com");
        await LoginAsync(secondClient, "order-race-b@example.com");
        await AddCartItemAsync(firstClient, seed.VariantId);
        await AddCartItemAsync(secondClient, seed.VariantId);

        var results = await Task.WhenAll(
            firstClient.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload()),
            secondClient.PostAsJsonAsync("/api/orders/checkout", CheckoutPayload()));

        Assert.Equal(1, results.Count(response => response.StatusCode == HttpStatusCode.Created));
        Assert.Equal(1, results.Count(response => response.StatusCode == HttpStatusCode.Conflict));

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal(1, await dbContext.RentalReservations.CountAsync(r => r.ProductInventoryItemId == seed.InventoryItemIds[0] && r.Status == "RESERVED"));
    }

    private static object CheckoutPayload(string? voucherCode = null)
    {
        return new
        {
            customerName = "Order Customer",
            customerPhone = "0901234567",
            customerEmail = "buyer@example.com",
            shippingAddress = "123 Nguyen Trai",
            customerNote = "Leave at reception",
            voucherCode
        };
    }

    private static async Task AddCartItemAsync(
        HttpClient client,
        int variantId,
        int quantity = 1,
        string start = "2026-09-10",
        int days = 1)
    {
        var response = await client.PostAsJsonAsync("/api/cart/items", new
        {
            productVariantId = variantId,
            quantity,
            rentalStartDate = start,
            rentalEndDate = DateOnly.Parse(start).AddDays(days).ToString("yyyy-MM-dd")
        });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task LoginAsync(HttpClient client, string email)
    {
        await EnsureUserAsync(email, RoleForEmail(email));
        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = Password
        });

        using var json = await ReadJsonAsync(response);
        var token = json.RootElement.GetProperty("data").GetProperty("token").GetString();
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<SeedResult> SeedCatalogAsync(
        string ownerEmail,
        int stock,
        decimal price1Day = 100000,
        decimal price3Day = 250000,
        decimal extraDayPrice = 70000,
        bool productActive = true,
        bool shopActive = true,
        bool variantActive = true)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var owner = await EnsureUserAsync(ownerEmail, "LENDER");
        var shop = new Shop
        {
            Name = $"Order Shop {Guid.NewGuid():N}",
            OwnerUserId = owner.Id,
            Phone = "0901234567",
            Address = "123 Nguyen Trai",
            IsActive = shopActive
        };

        var product = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = $"Order Dress {Guid.NewGuid():N}",
            Slug = $"order-dress-{Guid.NewGuid():N}",
            Price1Day = price1Day,
            Price3Day = price3Day,
            ExtraDayPrice = extraDayPrice,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = productActive,
            Images =
            [
                new ProductImage
                {
                    ImageUrl = "/images/order.jpg",
                    IsPrimary = true,
                    SortOrder = 0
                }
            ],
            Variants =
            [
                new ProductVariant
                {
                    Size = "M",
                    Color = "Red",
                    VariantCode = $"ORDER-M-{Guid.NewGuid():N}",
                    IsActive = variantActive
                }
            ]
        };

        for (var index = 0; index < stock; index += 1)
        {
            product.Variants.First().InventoryItems.Add(new ProductInventoryItem
            {
                AssetCode = $"order-stock-{Guid.NewGuid():N}",
                Condition = "GOOD",
                Status = "AVAILABLE"
            });
        }

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync();

        return new SeedResult(
            product.Id,
            product.Variants.First().Id,
            product.Variants.First().InventoryItems.Select(item => item.Id).ToArray());
    }

    private async Task SeedBlockingReservationAsync(
        SeedResult seed,
        DateOnly? start = null,
        DateOnly? end = null)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var owner = await EnsureUserAsync("reservation-owner@example.com", "CUSTOMER");
        var product = await dbContext.Products
            .Include(p => p.Variants)
            .FirstAsync(p => p.Id == seed.ProductId);
        var order = new DoRentMe.Api.Models.Order
        {
            OrderCode = $"BLOCK-{Guid.NewGuid():N}",
            ShopId = product.ShopId,
            UserId = owner.Id,
            CustomerName = "Blocker",
            CustomerPhone = "0901234567",
            ShippingAddress = "123 Test",
            TotalRent = 100000,
            TotalDeposit = 300000,
            TotalDiscount = 0,
            StartDate = start ?? new DateOnly(2026, 9, 10),
            EndDate = end ?? new DateOnly(2026, 9, 11),
            Items =
            [
                new OrderItem
                {
                    ProductId = seed.ProductId,
                    ProductVariantId = seed.VariantId,
                    ProductNameSnapshot = product.Name,
                    SizeSnapshot = "M",
                    ColorSnapshot = "Red",
                    Quantity = 1,
                    RentalStartDate = start ?? new DateOnly(2026, 9, 10),
                    RentalEndDate = end ?? new DateOnly(2026, 9, 11),
                    RentalDays = ((end ?? new DateOnly(2026, 9, 11)).DayNumber - (start ?? new DateOnly(2026, 9, 10)).DayNumber),
                    PricePerItem = 100000,
                    DepositPerItem = 300000,
                    LineSubtotal = 100000,
                    DepositSubtotal = 300000
                }
            ]
        };
        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync();
        dbContext.RentalReservations.Add(new RentalReservation
        {
            OrderItemId = order.Items.First().Id,
            ProductInventoryItemId = seed.InventoryItemIds[0],
            StartDate = order.StartDate,
            EndDate = order.EndDate,
            Status = "RESERVED"
        });
        await dbContext.SaveChangesAsync();
    }

    private async Task SeedVoucherAsync(
        string code,
        string discountType,
        decimal discountValue,
        decimal? minOrderAmount = null)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        dbContext.Vouchers.Add(new Voucher
        {
            Code = code,
            Name = code,
            DiscountType = discountType,
            DiscountValue = discountValue,
            MinOrderAmount = minOrderAmount,
            RequiredPoints = 0,
            StartAt = DateTime.UtcNow.AddDays(-1),
            UsedCount = 0,
            IsActive = true
        });
        await dbContext.SaveChangesAsync();
    }

    private async Task<User> EnsureUserAsync(string email, string roleCode)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == roleCode);
        if (role == null)
        {
            role = new Role { Code = roleCode, Name = roleCode, Description = $"{roleCode} role" };
            dbContext.Roles.Add(role);
            await dbContext.SaveChangesAsync();
        }

        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (user != null)
        {
            return user;
        }

        user = new User
        {
            Name = email,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Password),
            RoleId = role.Id,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static string RoleForEmail(string email)
    {
        if (email.Contains("admin", StringComparison.OrdinalIgnoreCase))
        {
            return "ADMIN";
        }

        if (email.Contains("lender", StringComparison.OrdinalIgnoreCase))
        {
            return "LENDER";
        }

        return "CUSTOMER";
    }

    private static async Task<int> FirstOrderIdAsync(HttpResponseMessage response)
    {
        using var json = await ReadJsonAsync(response);
        return json.RootElement.GetProperty("data").GetProperty("orders")[0].GetProperty("id").GetInt32();
    }

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }

    private sealed record SeedResult(
        int ProductId,
        int VariantId,
        int[] InventoryItemIds);
}
