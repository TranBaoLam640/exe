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

namespace DoRentMe.Api.Tests.Inventory;

public class InventoryApiTests : IDisposable
{
    private const string OwnerEmail = "inventory-owner@example.com";
    private const string OtherLenderEmail = "inventory-other-lender@example.com";
    private const string CustomerEmail = "inventory-customer@example.com";
    private const string AdminEmail = "inventory-admin@example.com";
    private const string Password = "Password123!";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public InventoryApiTests()
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
    public async Task Mutations_RequireAdminOrOwnerLender()
    {
        var seed = await SeedInventoryCatalogAsync();

        _client.DefaultRequestHeaders.Authorization = null;
        var unauthenticated = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "AUTH-UNAUTH");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        await LoginAsync(CustomerEmail);
        var customer = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "AUTH-CUSTOMER");
        Assert.Equal(HttpStatusCode.Forbidden, customer.StatusCode);

        await LoginAsync(OtherLenderEmail);
        var nonOwner = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "AUTH-OTHER");
        Assert.Equal(HttpStatusCode.Forbidden, nonOwner.StatusCode);

        await LoginAsync(OwnerEmail);
        var owner = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "AUTH-OWNER");
        Assert.Equal(HttpStatusCode.Created, owner.StatusCode);

        await LoginAsync(AdminEmail);
        var admin = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "AUTH-ADMIN");
        Assert.Equal(HttpStatusCode.Created, admin.StatusCode);
    }

    [Fact]
    public async Task Create_ValidatesInputAndRouteRelationship()
    {
        var seed = await SeedInventoryCatalogAsync();
        await LoginAsync(OwnerEmail);

        var valid = await CreateInventoryAsync(seed.ProductId, seed.VariantId, " new-asset ", condition: "fair");
        Assert.Equal(HttpStatusCode.Created, valid.StatusCode);
        using (var json = await ReadJsonAsync(valid))
        {
            var data = json.RootElement.GetProperty("data");
            Assert.Equal("new-asset", data.GetProperty("assetCode").GetString());
            Assert.Equal("FAIR", data.GetProperty("condition").GetString());
            Assert.Equal("AVAILABLE", data.GetProperty("status").GetString());
        }

        var duplicate = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "new-asset");
        var missingAsset = await _client.PostAsJsonAsync(
            $"/api/products/{seed.ProductId}/variants/{seed.VariantId}/inventory",
            new { condition = "GOOD" });
        var invalidCondition = await CreateInventoryAsync(seed.ProductId, seed.VariantId, "BAD-COND", condition: "BROKEN");
        var nonexistentProduct = await CreateInventoryAsync(999999, seed.VariantId, "NO-PRODUCT");
        var nonexistentVariant = await CreateInventoryAsync(seed.ProductId, 999999, "NO-VARIANT");
        var mismatchedVariant = await CreateInventoryAsync(seed.ProductId, seed.OtherProductVariantId, "MISMATCH");

        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingAsset.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidCondition.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, nonexistentProduct.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, nonexistentVariant.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, mismatchedVariant.StatusCode);
    }

    [Fact]
    public async Task ReadEndpoints_ReturnDetailsAndApplyFilters()
    {
        var seed = await SeedInventoryCatalogAsync();
        await LoginAsync(OwnerEmail);

        var byId = await _client.GetAsync($"/api/inventory/{seed.AvailableInventoryId}");
        var byProduct = await _client.GetAsync($"/api/products/{seed.ProductId}/inventory");
        var byStatus = await _client.GetAsync("/api/inventory?status=AVAILABLE");
        var byVariant = await _client.GetAsync($"/api/inventory?variantId={seed.VariantId}");

        Assert.Equal(HttpStatusCode.OK, byId.StatusCode);
        Assert.Equal(HttpStatusCode.OK, byProduct.StatusCode);
        Assert.Equal(HttpStatusCode.OK, byStatus.StatusCode);
        Assert.Equal(HttpStatusCode.OK, byVariant.StatusCode);

        using (var json = await ReadJsonAsync(byId))
        {
            var data = json.RootElement.GetProperty("data");
            Assert.Equal(seed.ProductId, data.GetProperty("productId").GetInt32());
            Assert.Equal(seed.VariantId, data.GetProperty("productVariantId").GetInt32());
            Assert.Equal("Inventory Dress", data.GetProperty("productName").GetString());
            Assert.Equal("M", data.GetProperty("size").GetString());
            Assert.Equal("Red", data.GetProperty("color").GetString());
        }

        using (var json = await ReadJsonAsync(byProduct))
        {
            Assert.Equal(2, json.RootElement.GetProperty("data").GetArrayLength());
        }

        using (var json = await ReadJsonAsync(byStatus))
        {
            var statuses = json.RootElement.GetProperty("data")
                .EnumerateArray()
                .Select(item => item.GetProperty("status").GetString())
                .Distinct()
                .ToList();

            Assert.Equal(["AVAILABLE"], statuses);
        }

        using (var json = await ReadJsonAsync(byVariant))
        {
            Assert.All(
                json.RootElement.GetProperty("data").EnumerateArray(),
                item => Assert.Equal(seed.VariantId, item.GetProperty("productVariantId").GetInt32()));
        }
    }

    [Fact]
    public async Task Update_ChangesMetadataAndEnforcesUniqueAssetCode()
    {
        var seed = await SeedInventoryCatalogAsync();
        await LoginAsync(OwnerEmail);

        var update = await _client.PutAsJsonAsync($"/api/inventory/{seed.AvailableInventoryId}", new
        {
            assetCode = " updated-asset ",
            condition = "worn",
            notes = " needs repair ",
            acquiredAt = "2026-09-01T00:00:00Z"
        });

        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        using (var json = await ReadJsonAsync(update))
        {
            var data = json.RootElement.GetProperty("data");
            Assert.Equal("updated-asset", data.GetProperty("assetCode").GetString());
            Assert.Equal("WORN", data.GetProperty("condition").GetString());
            Assert.Equal("needs repair", data.GetProperty("notes").GetString());
            Assert.True(data.GetProperty("updatedAt").GetDateTime() > data.GetProperty("createdAt").GetDateTime());
        }

        var duplicate = await _client.PutAsJsonAsync($"/api/inventory/{seed.AvailableInventoryId}", new
        {
            assetCode = seed.RentedAssetCode,
            condition = "GOOD",
            notes = "duplicate"
        });

        Assert.Equal(HttpStatusCode.BadRequest, duplicate.StatusCode);
    }

    [Fact]
    public async Task Status_ChangesAllowedStatusesAndRejectsInvalidStatus()
    {
        var seed = await SeedInventoryCatalogAsync();
        await LoginAsync(OwnerEmail);

        var valid = await _client.PutAsJsonAsync($"/api/inventory/{seed.AvailableInventoryId}/status", new
        {
            status = "retired"
        });
        var invalid = await _client.PutAsJsonAsync($"/api/inventory/{seed.AvailableInventoryId}/status", new
        {
            status = "SOLD"
        });

        Assert.Equal(HttpStatusCode.OK, valid.StatusCode);
        using (var json = await ReadJsonAsync(valid))
        {
            Assert.Equal("RETIRED", json.RootElement.GetProperty("data").GetProperty("status").GetString());
        }

        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
    }

    [Fact]
    public async Task Delete_RemovesUnusedInventoryButProtectsRentalHistory()
    {
        var seed = await SeedInventoryCatalogAsync(includeRentalHistory: true);
        await LoginAsync(OwnerEmail);

        var deleteUnused = await _client.DeleteAsync($"/api/inventory/{seed.RentedInventoryId}");
        Assert.Equal(HttpStatusCode.NoContent, deleteUnused.StatusCode);

        var deletedRead = await _client.GetAsync($"/api/inventory/{seed.RentedInventoryId}");
        Assert.Equal(HttpStatusCode.NotFound, deletedRead.StatusCode);

        var deleteReferenced = await _client.DeleteAsync($"/api/inventory/{seed.AvailableInventoryId}");
        Assert.Equal(HttpStatusCode.Conflict, deleteReferenced.StatusCode);

        var retireReferenced = await _client.PutAsJsonAsync($"/api/inventory/{seed.AvailableInventoryId}/status", new
        {
            status = "RETIRED"
        });

        Assert.Equal(HttpStatusCode.OK, retireReferenced.StatusCode);
        using var json = await ReadJsonAsync(retireReferenced);
        Assert.Equal("RETIRED", json.RootElement.GetProperty("data").GetProperty("status").GetString());
    }

    private async Task<HttpResponseMessage> CreateInventoryAsync(
        int productId,
        int variantId,
        string assetCode,
        string condition = "GOOD")
    {
        return await _client.PostAsJsonAsync($"/api/products/{productId}/variants/{variantId}/inventory", new
        {
            assetCode,
            condition,
            notes = "Seeded from test"
        });
    }

    private async Task LoginAsync(string email)
    {
        var response = await _client.PostAsJsonAsync("/api/auth/login", new
        {
            email,
            password = Password
        });

        using var json = await ReadJsonAsync(response);
        var token = json.RootElement.GetProperty("data").GetProperty("token").GetString();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
    }

    private async Task<SeedResult> SeedInventoryCatalogAsync(bool includeRentalHistory = false)
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var owner = await EnsureUserAsync(dbContext, "LENDER", OwnerEmail);
        var otherLender = await EnsureUserAsync(dbContext, "LENDER", OtherLenderEmail);
        await EnsureUserAsync(dbContext, "CUSTOMER", CustomerEmail);
        await EnsureUserAsync(dbContext, "ADMIN", AdminEmail);

        var shop = new Shop
        {
            Name = $"Inventory Shop {Guid.NewGuid():N}",
            OwnerUserId = owner.Id,
            Phone = "0901234567",
            Address = "123 Inventory",
            IsActive = true
        };

        var otherShop = new Shop
        {
            Name = $"Other Inventory Shop {Guid.NewGuid():N}",
            OwnerUserId = otherLender.Id,
            Phone = "0909999999",
            Address = "456 Inventory",
            IsActive = true
        };

        var product = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = "Inventory Dress",
            Slug = $"inventory-dress-{Guid.NewGuid():N}",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true,
            Variants =
            [
                new ProductVariant
                {
                    Size = "M",
                    Color = "Red",
                    VariantCode = $"INV-M-{Guid.NewGuid():N}",
                    IsActive = true,
                    InventoryItems =
                    [
                        new ProductInventoryItem
                        {
                            AssetCode = $"INV-AVAILABLE-{Guid.NewGuid():N}",
                            Condition = "GOOD",
                            Status = "AVAILABLE"
                        },
                        new ProductInventoryItem
                        {
                            AssetCode = $"INV-RENTED-{Guid.NewGuid():N}",
                            Condition = "FAIR",
                            Status = "RENTED"
                        }
                    ]
                }
            ]
        };

        var otherProduct = new DoRentMe.Api.Models.Product
        {
            Shop = otherShop,
            Name = "Other Inventory Dress",
            Slug = $"other-inventory-dress-{Guid.NewGuid():N}",
            Price1Day = 90000,
            Price3Day = 210000,
            ExtraDayPrice = 60000,
            PriceDeposit = 250000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true,
            Variants =
            [
                new ProductVariant
                {
                    Size = "S",
                    Color = "Blue",
                    VariantCode = $"OTHER-INV-S-{Guid.NewGuid():N}",
                    IsActive = true
                }
            ]
        };

        dbContext.Products.AddRange(product, otherProduct);
        await dbContext.SaveChangesAsync();

        var variant = product.Variants.Single();
        var availableItem = variant.InventoryItems.First(item => item.Status == "AVAILABLE");
        var rentedItem = variant.InventoryItems.First(item => item.Status == "RENTED");

        if (includeRentalHistory)
        {
            var order = new Order
            {
                OrderCode = $"INV-ORDER-{Guid.NewGuid():N}",
                ShopId = shop.Id,
                CustomerName = "Inventory Customer",
                CustomerPhone = "0901234567",
                ShippingAddress = "123 Inventory",
                TotalRent = 100000,
                TotalDeposit = 300000,
                TotalDiscount = 0,
                StartDate = new DateOnly(2026, 9, 10),
                EndDate = new DateOnly(2026, 9, 11),
                Items =
                [
                    new OrderItem
                    {
                        ProductId = product.Id,
                        ProductVariantId = variant.Id,
                        ProductNameSnapshot = product.Name,
                        SizeSnapshot = variant.Size,
                        ColorSnapshot = variant.Color,
                        Quantity = 1,
                        RentalStartDate = new DateOnly(2026, 9, 10),
                        RentalEndDate = new DateOnly(2026, 9, 11),
                        RentalDays = 1,
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
                ProductInventoryItemId = availableItem.Id,
                StartDate = new DateOnly(2026, 9, 10),
                EndDate = new DateOnly(2026, 9, 11),
                Status = "RESERVED"
            });
            await dbContext.SaveChangesAsync();
        }

        return new SeedResult(
            product.Id,
            variant.Id,
            otherProduct.Variants.Single().Id,
            availableItem.Id,
            rentedItem.Id,
            rentedItem.AssetCode);
    }

    private static async Task<User> EnsureUserAsync(
        DoRentMeDbContext dbContext,
        string roleCode,
        string email)
    {
        var role = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == roleCode);
        if (role == null)
        {
            role = new Role
            {
                Code = roleCode,
                Name = roleCode,
                Description = $"{roleCode} role"
            };
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

    private static async Task<JsonDocument> ReadJsonAsync(HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();
        return JsonDocument.Parse(content);
    }

    private sealed record SeedResult(
        int ProductId,
        int VariantId,
        int OtherProductVariantId,
        int AvailableInventoryId,
        int RentedInventoryId,
        string RentedAssetCode);
}
