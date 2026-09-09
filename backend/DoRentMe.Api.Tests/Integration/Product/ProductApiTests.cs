using System.Net;
using System.Text.Json;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoRentMe.Api.Tests.Product;

public class ProductApiTests : IDisposable
{
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
    public async Task GetAll_WithExistingProduct_ReturnsOk()
    {
        await SeedProductAsync();

        var response = await _client.GetAsync("/api/products");

        Assert.Equal(
            HttpStatusCode.OK,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);
        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var products = root.GetProperty("data");

        Assert.Equal(
            JsonValueKind.Array,
            products.ValueKind);

        var product = Assert.Single(
            products.EnumerateArray());

        Assert.Equal(
            "Ao dai",
            product.GetProperty("name").GetString());

        Assert.Single(
            product.GetProperty("categories").EnumerateArray());

        Assert.Single(
            product.GetProperty("variants").EnumerateArray());
    }

    private async Task SeedProductAsync()
    {
        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var shop = new Shop
        {
            Name = "Main Shop",
            OwnerUserId = 1,
            Phone = "0901234567",
            Address = "123 Nguyen Trai",
            IsActive = true
        };

        var category = new Category
        {
            Name = "Dress",
            Slug = "dress",
            IsActive = true
        };

        var product = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = "Ao dai",
            Slug = "ao-dai",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true,
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
                    Size = "M",
                    Color = "Red",
                    VariantCode = "PRD1-M-RED",
                    IsActive = true
                }
            ]
        };

        dbContext.Products.Add(product);

        await dbContext.SaveChangesAsync();
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        return JsonDocument.Parse(content);
    }
}
