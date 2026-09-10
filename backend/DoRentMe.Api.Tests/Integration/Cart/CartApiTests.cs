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

namespace DoRentMe.Api.Tests.Cart;

public class CartApiTests : IDisposable
{
    private const string CustomerEmail = "cart-customer@example.com";
    private const string OtherCustomerEmail = "cart-other@example.com";
    private const string Password = "Password123!";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public CartApiTests()
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
    public async Task GetCart_RequiresAuthAndAutoCreatesActiveCart()
    {
        var unauthorized = await _client.GetAsync("/api/cart");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        await LoginAsync(CustomerEmail);
        var response = await _client.GetAsync("/api/cart");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var json = await ReadJsonAsync(response);
        var data = json.RootElement.GetProperty("data");

        Assert.Equal("active", data.GetProperty("status").GetString());
        Assert.Equal(0, data.GetProperty("itemCount").GetInt32());

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var user = await dbContext.Users.SingleAsync(u => u.Email == CustomerEmail);
        Assert.Equal(1, await dbContext.Carts.CountAsync(c => c.UserId == user.Id && c.Status == "active"));
    }

    [Fact]
    public async Task AddItem_DuplicateVariantAndDates_IncrementsQuantityAndCalculatesTotals()
    {
        var seed = await SeedCartCatalogAsync(availableStock: 3);
        await LoginAsync(CustomerEmail);

        var first = await AddItemAsync(seed.ActiveVariantId, quantity: 1, days: 1);
        var duplicate = await AddItemAsync(seed.ActiveVariantId, quantity: 2, days: 1);

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, duplicate.StatusCode);

        using var json = await ReadJsonAsync(duplicate);
        var data = json.RootElement.GetProperty("data");
        var item = Assert.Single(data.GetProperty("items").EnumerateArray());

        Assert.Equal(3, item.GetProperty("quantity").GetInt32());
        Assert.Equal(1, item.GetProperty("rentalDays").GetInt32());
        Assert.Equal(100000m, item.GetProperty("rentalPrice").GetDecimal());
        Assert.Equal(300000m, item.GetProperty("lineSubtotal").GetDecimal());
        Assert.Equal(900000m, data.GetProperty("depositTotal").GetDecimal());
        Assert.Equal(1200000m, data.GetProperty("grandTotalPreview").GetDecimal());
    }

    [Theory]
    [InlineData(1, 100000)]
    [InlineData(3, 250000)]
    [InlineData(5, 390000)]
    public async Task AddItem_UsesBackendRentalPricingByDuration(int days, decimal expectedRentalPrice)
    {
        var seed = await SeedCartCatalogAsync();
        await LoginAsync(CustomerEmail);

        var response = await AddItemAsync(seed.ActiveVariantId, quantity: 1, days: days);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var json = await ReadJsonAsync(response);
        var item = Assert.Single(json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
        Assert.Equal(expectedRentalPrice, item.GetProperty("rentalPrice").GetDecimal());
    }

    [Fact]
    public async Task AddItem_RejectsUnavailableVariantsAndStock()
    {
        var seed = await SeedCartCatalogAsync(availableStock: 1);
        await LoginAsync(CustomerEmail);

        var nonexistent = await AddItemAsync(999999, quantity: 1);
        var inactiveProduct = await AddItemAsync(seed.InactiveProductVariantId, quantity: 1);
        var inactiveVariant = await AddItemAsync(seed.InactiveVariantId, quantity: 1);
        var insufficientStock = await AddItemAsync(seed.ActiveVariantId, quantity: 2);
        var invalidDates = await _client.PostAsJsonAsync("/api/cart/items", new
        {
            productVariantId = seed.ActiveVariantId,
            quantity = 1,
            rentalStartDate = "2026-09-10",
            rentalEndDate = "2026-09-10"
        });

        Assert.Equal(HttpStatusCode.NotFound, nonexistent.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, inactiveProduct.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, inactiveVariant.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, insufficientStock.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidDates.StatusCode);
    }

    [Fact]
    public async Task AddItem_AvailableStockIgnoresNonAvailableInventoryAndOverlappingReservations()
    {
        var seed = await SeedCartCatalogAsync(availableStock: 2, addRentedInventory: true, reserveOneAvailableItem: true);
        await LoginAsync(CustomerEmail);

        var one = await AddItemAsync(seed.ActiveVariantId, quantity: 1);
        var two = await AddItemAsync(seed.ActiveVariantId, quantity: 2);

        Assert.Equal(HttpStatusCode.Created, one.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, two.StatusCode);

        using var json = await ReadJsonAsync(one);
        var item = Assert.Single(json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
        Assert.Equal(1, item.GetProperty("availableStock").GetInt32());
    }

    [Fact]
    public async Task UpdateAndRemove_AreScopedToCurrentUsersCart()
    {
        var seed = await SeedCartCatalogAsync(availableStock: 3);
        await LoginAsync(CustomerEmail);
        var add = await AddItemAsync(seed.ActiveVariantId, quantity: 1);
        var itemId = await FirstItemIdAsync(add);

        var update = await _client.PutAsJsonAsync($"/api/cart/items/{itemId}", new
        {
            quantity = 2,
            rentalStartDate = "2026-09-10",
            rentalEndDate = "2026-09-13"
        });

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);

        await LoginAsync(OtherCustomerEmail);
        var otherUpdate = await _client.PutAsJsonAsync($"/api/cart/items/{itemId}", new
        {
            quantity = 1,
            rentalStartDate = "2026-09-10",
            rentalEndDate = "2026-09-11"
        });
        var otherDelete = await _client.DeleteAsync($"/api/cart/items/{itemId}");

        Assert.Equal(HttpStatusCode.NotFound, otherUpdate.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherDelete.StatusCode);

        await LoginAsync(CustomerEmail);
        var remove = await _client.DeleteAsync($"/api/cart/items/{itemId}");

        Assert.Equal(HttpStatusCode.OK, remove.StatusCode);
        using var json = await ReadJsonAsync(remove);
        Assert.Empty(json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());
    }

    [Fact]
    public async Task DiscountPreview_ValidatesVoucherAndDoesNotMutateUsage()
    {
        var seed = await SeedCartCatalogAsync();
        await LoginAsync(CustomerEmail);
        await AddItemAsync(seed.ActiveVariantId, quantity: 1, days: 3);
        await SeedVoucherAsync("CART50", "fixed", 50000, minOrderAmount: 200000);

        var preview = await _client.PostAsJsonAsync("/api/cart/discount-preview", new { code = "CART50" });

        Assert.Equal(HttpStatusCode.OK, preview.StatusCode);
        using var json = await ReadJsonAsync(preview);
        var data = json.RootElement.GetProperty("data");
        var discount = data.GetProperty("discount");

        Assert.Equal(50000m, discount.GetProperty("discountAmount").GetDecimal());
        Assert.Equal(500000m, data.GetProperty("grandTotalPreview").GetDecimal());

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var voucher = await dbContext.Vouchers.SingleAsync(v => v.Code == "CART50");
        Assert.Equal(0, voucher.UsedCount);
    }

    [Fact]
    public async Task DiscountPreview_RejectsExpiredAndIneligibleVoucher()
    {
        var seed = await SeedCartCatalogAsync();
        await LoginAsync(CustomerEmail);
        await AddItemAsync(seed.ActiveVariantId, quantity: 1, days: 1);
        await SeedVoucherAsync("EXPIRED", "fixed", 10000, endAt: DateTime.UtcNow.AddDays(-1));
        await SeedVoucherAsync("MIN999", "fixed", 10000, minOrderAmount: 999999);

        var expired = await _client.PostAsJsonAsync("/api/cart/discount-preview", new { code = "EXPIRED" });
        var min = await _client.PostAsJsonAsync("/api/cart/discount-preview", new { code = "MIN999" });

        Assert.Equal(HttpStatusCode.BadRequest, expired.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, min.StatusCode);
    }

    private async Task<HttpResponseMessage> AddItemAsync(int variantId, int quantity, int days = 1)
    {
        return await _client.PostAsJsonAsync("/api/cart/items", new
        {
            productVariantId = variantId,
            quantity,
            rentalStartDate = "2026-09-10",
            rentalEndDate = DateOnly.Parse("2026-09-10").AddDays(days).ToString("yyyy-MM-dd")
        });
    }

    private async Task<int> FirstItemIdAsync(HttpResponseMessage response)
    {
        using var json = await ReadJsonAsync(response);
        return json.RootElement.GetProperty("data").GetProperty("items")[0].GetProperty("id").GetInt32();
    }

    private async Task LoginAsync(string email)
    {
        await EnsureCustomerAsync(email);
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = Password
        });

        using var json = await ReadJsonAsync(response);
        var token = json.RootElement.GetProperty("data").GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<SeedResult> SeedCartCatalogAsync(
        int availableStock = 2,
        bool addRentedInventory = false,
        bool reserveOneAvailableItem = false)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var owner = await EnsureCustomerAsync("cart-owner@example.com");

        var shop = new Shop
        {
            Name = Guid.NewGuid().ToString("N"),
            OwnerUserId = owner.Id,
            Phone = "0901234567",
            Address = "123 Nguyen Trai",
            IsActive = true
        };

        var activeProduct = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = $"Cart Dress {Guid.NewGuid():N}",
            Slug = $"cart-dress-{Guid.NewGuid():N}",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true,
            Images =
            [
                new ProductImage
                {
                    ImageUrl = "/images/cart.jpg",
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
                    VariantCode = $"CART-M-{Guid.NewGuid():N}",
                    IsActive = true
                },
                new ProductVariant
                {
                    Size = "S",
                    Color = "Black",
                    VariantCode = $"CART-S-{Guid.NewGuid():N}",
                    IsActive = false,
                    InventoryItems =
                    [
                        new ProductInventoryItem
                        {
                            AssetCode = $"inactive-variant-{Guid.NewGuid():N}",
                            Condition = "GOOD",
                            Status = "AVAILABLE"
                        }
                    ]
                }
            ]
        };

        var activeVariant = activeProduct.Variants.First();
        for (var index = 0; index < availableStock; index += 1)
        {
            activeVariant.InventoryItems.Add(new ProductInventoryItem
            {
                AssetCode = $"active-{Guid.NewGuid():N}",
                Condition = "GOOD",
                Status = "AVAILABLE"
            });
        }

        if (addRentedInventory)
        {
            activeVariant.InventoryItems.Add(new ProductInventoryItem
            {
                AssetCode = $"rented-{Guid.NewGuid():N}",
                Condition = "GOOD",
                Status = "RENTED"
            });
        }

        var inactiveProduct = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = $"Inactive Cart Dress {Guid.NewGuid():N}",
            Slug = $"inactive-cart-dress-{Guid.NewGuid():N}",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = false,
            Variants =
            [
                new ProductVariant
                {
                    Size = "M",
                    Color = "White",
                    VariantCode = $"INACTIVE-PRODUCT-{Guid.NewGuid():N}",
                    IsActive = true,
                    InventoryItems =
                    [
                        new ProductInventoryItem
                        {
                            AssetCode = $"inactive-product-{Guid.NewGuid():N}",
                            Condition = "GOOD",
                            Status = "AVAILABLE"
                        }
                    ]
                }
            ]
        };

        dbContext.Products.AddRange(activeProduct, inactiveProduct);
        await dbContext.SaveChangesAsync();

        if (reserveOneAvailableItem)
        {
            var inventoryItem = await dbContext.ProductInventoryItems
                .FirstAsync(item => item.ProductVariantId == activeVariant.Id && item.Status == "AVAILABLE");

            var order = new Order
            {
                OrderCode = $"ORDER-{Guid.NewGuid():N}",
                ShopId = shop.Id,
                CustomerName = "Tester",
                CustomerPhone = "0901234567",
                ShippingAddress = "123 Test",
                TotalRent = 100000,
                TotalDeposit = 300000,
                TotalDiscount = 0,
                StartDate = new DateOnly(2026, 9, 10),
                EndDate = new DateOnly(2026, 9, 11),
                Items =
                [
                    new OrderItem
                    {
                        ProductId = activeProduct.Id,
                        ProductVariantId = activeVariant.Id,
                        ProductNameSnapshot = activeProduct.Name,
                        SizeSnapshot = "M",
                        ColorSnapshot = "Red",
                        Quantity = 1,
                        PricePerItem = 100000,
                        DepositPerItem = 300000
                    }
                ]
            };

            dbContext.Orders.Add(order);
            await dbContext.SaveChangesAsync();

            dbContext.RentalReservations.Add(new RentalReservation
            {
                OrderItemId = order.Items.First().Id,
                ProductInventoryItemId = inventoryItem.Id,
                StartDate = new DateOnly(2026, 9, 10),
                EndDate = new DateOnly(2026, 9, 11),
                Status = "RESERVED"
            });
            await dbContext.SaveChangesAsync();
        }

        return new SeedResult(
            activeVariant.Id,
            activeProduct.Variants.Last().Id,
            inactiveProduct.Variants.First().Id);
    }

    private async Task SeedVoucherAsync(
        string code,
        string discountType,
        decimal discountValue,
        decimal? minOrderAmount = null,
        DateTime? endAt = null)
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
            EndAt = endAt,
            UsedCount = 0,
            IsActive = true
        });
        await dbContext.SaveChangesAsync();
    }

    private async Task<User> EnsureCustomerAsync(string email)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var role = await dbContext.Roles.SingleAsync(r => r.Code == "CUSTOMER");
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

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }

    private sealed record SeedResult(
        int ActiveVariantId,
        int InactiveVariantId,
        int InactiveProductVariantId);
}
