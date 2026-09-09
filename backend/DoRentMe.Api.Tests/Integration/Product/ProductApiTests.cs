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

namespace DoRentMe.Api.Tests.Product;

public class ProductApiTests : IDisposable
{
    private const string LenderEmail = "lender@example.com";
    private const string OtherLenderEmail = "other-lender@example.com";
    private const string AdminEmail = "admin@example.com";
    private const string Password = "Password123!";

    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProductApiTests()
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
    public async Task GetAll_AppliesCatalogQueryAndPagination()
    {
        var seed = await SeedCatalogAsync();

        var response = await _client.GetAsync(
            $"/api/products?search=silk&categoryIds={seed.DressCategoryId}&brandId={seed.BrandId}&shopId={seed.ShopId}&size=M&color=Red&condition=GOOD&inStock=true&minPrice=90000&maxPrice=150000&sortBy=price1Day&sortDirection=asc&page=1&pageSize=1");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        var data = json.RootElement.GetProperty("data");

        Assert.Equal(1, data.GetProperty("page").GetInt32());
        Assert.Equal(1, data.GetProperty("pageSize").GetInt32());
        Assert.Equal(1, data.GetProperty("totalItems").GetInt32());
        Assert.Equal(1, data.GetProperty("totalPages").GetInt32());

        var product = Assert.Single(data.GetProperty("items").EnumerateArray());
        Assert.Equal("Silk Dress", product.GetProperty("name").GetString());
        Assert.Equal(2, product.GetProperty("totalStock").GetInt32());
        Assert.Equal(1, product.GetProperty("availableStock").GetInt32());
        Assert.True(product.GetProperty("primaryImage").GetProperty("isPrimary").GetBoolean());
        Assert.Equal(1, product.GetProperty("variants").GetArrayLength());
    }

    [Fact]
    public async Task PublicCatalog_HidesInactiveProductsAndInactiveDetails()
    {
        var seed = await SeedCatalogAsync();

        var listResponse = await _client.GetAsync("/api/products");
        using var json = await ReadJsonAsync(listResponse);

        var names = json.RootElement.GetProperty("data").GetProperty("items")
            .EnumerateArray()
            .Select(item => item.GetProperty("name").GetString())
            .ToList();

        Assert.DoesNotContain("Inactive Dress", names);

        var detailResponse = await _client.GetAsync($"/api/products/{seed.InactiveProductId}");

        Assert.Equal(HttpStatusCode.NotFound, detailResponse.StatusCode);
    }

    [Fact]
    public async Task GetAll_SupportsBrandShopSizeColorConditionInStockAndPriceFilters()
    {
        var seed = await SeedCatalogAsync();

        await AssertSingleProductAsync($"/api/products?brandId={seed.BrandId}", "Silk Dress");
        await AssertSingleProductAsync($"/api/products?shopId={seed.ShopId}", "Silk Dress");
        await AssertSingleProductAsync("/api/products?size=M", "Silk Dress");
        await AssertSingleProductAsync("/api/products?color=Red", "Silk Dress");
        await AssertSingleProductAsync("/api/products?condition=GOOD", "Silk Dress");
        await AssertSingleProductAsync("/api/products?inStock=true", "Silk Dress");
        await AssertSingleProductAsync("/api/products?minPrice=90000&maxPrice=120000", "Silk Dress");
    }

    [Fact]
    public async Task GetAll_SortsDeterministically()
    {
        await SeedCatalogAsync(includeSecondVisibleProduct: true);

        var asc = await GetProductNamesAsync("/api/products?sortBy=name&sortDirection=asc");
        var desc = await GetProductNamesAsync("/api/products?sortBy=name&sortDirection=desc");

        Assert.Equal(["Cotton Dress", "Silk Dress"], asc);
        Assert.Equal(["Silk Dress", "Cotton Dress"], desc);
    }

    [Fact]
    public async Task FavoriteEndpoints_RequireAuthAndAreIdempotent()
    {
        var seed = await SeedCatalogAsync();

        var unauthorized = await _client.PostAsync($"/api/products/{seed.ProductId}/favorite", null);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        await LoginAsync(LenderEmail);

        var favorite = await _client.PostAsync($"/api/products/{seed.ProductId}/favorite", null);
        var duplicate = await _client.PostAsync($"/api/products/{seed.ProductId}/favorite", null);
        var favorites = await _client.GetAsync("/api/products/favorites");
        var unfavorite = await _client.DeleteAsync($"/api/products/{seed.ProductId}/favorite");
        var secondUnfavorite = await _client.DeleteAsync($"/api/products/{seed.ProductId}/favorite");

        Assert.Equal(HttpStatusCode.OK, favorite.StatusCode);
        Assert.Equal(HttpStatusCode.OK, duplicate.StatusCode);
        Assert.Equal(HttpStatusCode.OK, favorites.StatusCode);
        Assert.Equal(HttpStatusCode.OK, unfavorite.StatusCode);
        Assert.Equal(HttpStatusCode.OK, secondUnfavorite.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        Assert.Equal(0, await dbContext.ProductLikes.CountAsync());
    }

    [Fact]
    public async Task ProductCrud_EnforcesOwnerAndAdminAuthorization()
    {
        var seed = await SeedCatalogAsync();

        var unauthenticated = await _client.DeleteAsync($"/api/products/{seed.ProductId}");
        Assert.Equal(HttpStatusCode.Unauthorized, unauthenticated.StatusCode);

        await LoginAsync(OtherLenderEmail);
        var forbidden = await _client.DeleteAsync($"/api/products/{seed.ProductId}");
        Assert.Equal(HttpStatusCode.Forbidden, forbidden.StatusCode);

        await LoginAsync(LenderEmail);
        var ownedDelete = await _client.DeleteAsync($"/api/products/{seed.ProductId}");
        Assert.Equal(HttpStatusCode.OK, ownedDelete.StatusCode);

        var secondSeed = await SeedCatalogAsync(uniquePrefix: "admin");
        await LoginAsync(AdminEmail);
        var adminDelete = await _client.DeleteAsync($"/api/products/{secondSeed.ProductId}");
        Assert.Equal(HttpStatusCode.OK, adminDelete.StatusCode);
    }

    [Fact]
    public async Task Images_KeepSinglePrimaryImage()
    {
        var seed = await SeedCatalogAsync();
        await LoginAsync(LenderEmail);

        var first = await _client.PostAsJsonAsync($"/api/products/{seed.ProductId}/images", new
        {
            imageUrl = "/images/first.jpg",
            isPrimary = true,
            sortOrder = 0
        });
        var second = await _client.PostAsJsonAsync($"/api/products/{seed.ProductId}/images", new
        {
            imageUrl = "/images/second.jpg",
            isPrimary = true,
            sortOrder = 1
        });
        var imagesResponse = await _client.GetAsync($"/api/products/{seed.ProductId}/images");

        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        Assert.Equal(HttpStatusCode.Created, second.StatusCode);

        using var json = await ReadJsonAsync(imagesResponse);
        var primaryCount = json.RootElement.GetProperty("data")
            .EnumerateArray()
            .Count(image => image.GetProperty("isPrimary").GetBoolean());

        Assert.Equal(1, primaryCount);
    }

    [Fact]
    public async Task BrandPutAndShopEndpoints_WorkForCatalog()
    {
        var seed = await SeedCatalogAsync();

        var brandResponse = await _client.PutAsJsonAsync($"/api/brands/{seed.BrandId}", new
        {
            name = "Updated Brand",
            isActive = true
        });
        var shopsResponse = await _client.GetAsync("/api/shops");
        var shopResponse = await _client.GetAsync($"/api/shops/{seed.ShopId}");

        Assert.Equal(HttpStatusCode.OK, brandResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, shopsResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, shopResponse.StatusCode);

        using var shopJson = await ReadJsonAsync(shopResponse);
        Assert.Equal("Main Shop", shopJson.RootElement.GetProperty("data").GetProperty("name").GetString());
        Assert.False(shopJson.RootElement.GetProperty("data").TryGetProperty("bankAccountNo", out _));
    }

    private async Task AssertSingleProductAsync(string requestUri, string expectedName)
    {
        var response = await _client.GetAsync(requestUri);
        using var json = await ReadJsonAsync(response);
        var product = Assert.Single(json.RootElement.GetProperty("data").GetProperty("items").EnumerateArray());

        Assert.Equal(expectedName, product.GetProperty("name").GetString());
    }

    private async Task<List<string?>> GetProductNamesAsync(string requestUri)
    {
        var response = await _client.GetAsync(requestUri);
        using var json = await ReadJsonAsync(response);

        return json.RootElement.GetProperty("data").GetProperty("items")
            .EnumerateArray()
            .Select(product => product.GetProperty("name").GetString())
            .ToList();
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

    private async Task<SeedResult> SeedCatalogAsync(
        bool includeSecondVisibleProduct = false,
        string uniquePrefix = "main")
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var lenderRole = await dbContext.Roles.SingleAsync(r => r.Code == "LENDER");
        var customerRole = await dbContext.Roles.SingleAsync(r => r.Code == "CUSTOMER");
        var adminRole = await dbContext.Roles.FirstOrDefaultAsync(r => r.Code == "ADMIN");
        if (adminRole == null)
        {
            adminRole = new Role
            {
                Code = "ADMIN",
                Name = "Admin",
                Description = "Admin role"
            };
            dbContext.Roles.Add(adminRole);
            await dbContext.SaveChangesAsync();
        }

        var lender = await EnsureUserAsync(dbContext, lenderRole.Id, LenderEmail);
        var otherLender = await EnsureUserAsync(dbContext, lenderRole.Id, OtherLenderEmail);
        await EnsureUserAsync(dbContext, adminRole.Id, AdminEmail);

        var shop = new Shop
        {
            Name = "Main Shop",
            OwnerUserId = lender.Id,
            Phone = "0901234567",
            Address = "123 Nguyen Trai",
            IsActive = true
        };

        var otherShop = new Shop
        {
            Name = "Other Shop",
            OwnerUserId = otherLender.Id,
            Phone = "0900000000",
            Address = "456 Le Loi",
            IsActive = true
        };

        var category = new Category
        {
            Name = $"{uniquePrefix} Dress",
            Slug = $"{uniquePrefix}-dress",
            IsActive = true
        };

        var brand = new Brand
        {
            Name = $"{uniquePrefix} Brand",
            Slug = $"{uniquePrefix}-brand",
            IsActive = true
        };

        var visibleProduct = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Brand = brand,
            Name = "Silk Dress",
            Slug = $"{uniquePrefix}-silk-dress",
            Description = "Premium silk evening dress",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true,
            CreatedAt = DateTime.UtcNow.AddMinutes(-2),
            ProductCategories =
            [
                new ProductCategory
                {
                    Category = category
                }
            ],
            Images =
            [
                new ProductImage
                {
                    ImageUrl = "/images/silk.jpg",
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
                    VariantCode = $"{uniquePrefix}-M-RED",
                    IsActive = true,
                    InventoryItems =
                    [
                        new ProductInventoryItem
                        {
                            AssetCode = $"{uniquePrefix}-asset-1",
                            Condition = "GOOD",
                            Status = "AVAILABLE"
                        },
                        new ProductInventoryItem
                        {
                            AssetCode = $"{uniquePrefix}-asset-2",
                            Condition = "FAIR",
                            Status = "RENTED"
                        }
                    ]
                },
                new ProductVariant
                {
                    Size = "L",
                    Color = "Blue",
                    VariantCode = $"{uniquePrefix}-L-BLUE",
                    IsActive = false,
                    InventoryItems =
                    [
                        new ProductInventoryItem
                        {
                            AssetCode = $"{uniquePrefix}-asset-3",
                            Condition = "GOOD",
                            Status = "AVAILABLE"
                        }
                    ]
                }
            ]
        };

        var inactiveProduct = new DoRentMe.Api.Models.Product
        {
            Shop = otherShop,
            Name = "Inactive Dress",
            Slug = $"{uniquePrefix}-inactive-dress",
            Price1Day = 50000,
            Price3Day = 100000,
            ExtraDayPrice = 20000,
            PriceDeposit = 150000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = false
        };

        dbContext.Products.AddRange(visibleProduct, inactiveProduct);

        if (includeSecondVisibleProduct)
        {
            dbContext.Products.Add(new DoRentMe.Api.Models.Product
            {
                Shop = shop,
                Brand = brand,
                Name = "Cotton Dress",
                Slug = $"{uniquePrefix}-cotton-dress",
                Description = "Cotton day dress",
                Price1Day = 80000,
                Price3Day = 200000,
                ExtraDayPrice = 50000,
                PriceDeposit = 200000,
                CleaningCost = 10000,
                MaintenanceCost = 5000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMinutes(-1),
                ProductCategories =
                [
                    new ProductCategory
                    {
                        Category = category
                    }
                ],
                Variants =
                [
                    new ProductVariant
                    {
                        Size = "S",
                        Color = "White",
                        VariantCode = $"{uniquePrefix}-S-WHITE",
                        IsActive = true
                    }
                ]
            });
        }

        await dbContext.SaveChangesAsync();

        return new SeedResult(
            visibleProduct.Id,
            inactiveProduct.Id,
            shop.Id,
            brand.Id,
            category.Id);
    }

    private static async Task<User> EnsureUserAsync(
        DoRentMeDbContext dbContext,
        int roleId,
        string email)
    {
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
            RoleId = roleId,
            LoyaltyPoints = 0,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();

        return user;
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        return JsonDocument.Parse(content);
    }

    private sealed record SeedResult(
        int ProductId,
        int InactiveProductId,
        int ShopId,
        int BrandId,
        int DressCategoryId);
}
