using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoRentMe.Api.Tests.Inventory;

public class ProductAvailabilityApiTests : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ProductAvailabilityApiTests()
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
    public async Task Availability_ValidatesProductAndDateRange()
    {
        var seed = await SeedAvailabilityCatalogAsync();

        var notFound = await _client.GetAsync("/api/products/999999/availability?startDate=2026-09-20&endDate=2026-09-23");
        var missingStart = await _client.GetAsync($"/api/products/{seed.ProductId}/availability?endDate=2026-09-23");
        var missingEnd = await _client.GetAsync($"/api/products/{seed.ProductId}/availability?startDate=2026-09-20");
        var invalidRange = await _client.GetAsync($"/api/products/{seed.ProductId}/availability?startDate=2026-09-23&endDate=2026-09-23");
        var inactiveProduct = await _client.GetAsync($"/api/products/{seed.InactiveProductId}/availability?startDate=2026-09-20&endDate=2026-09-23");

        Assert.Equal(HttpStatusCode.NotFound, notFound.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingStart.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, missingEnd.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, invalidRange.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, inactiveProduct.StatusCode);
    }

    [Fact]
    public async Task Availability_UsesCheckoutOverlapAndReservationStatusSemantics()
    {
        var seed = await SeedAvailabilityCatalogAsync();

        var response = await _client.GetAsync($"/api/products/{seed.ProductId}/availability?startDate=2026-09-20&endDate=2026-09-23");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var json = await ReadJsonAsync(response);
        var data = json.RootElement.GetProperty("data");
        Assert.Equal(seed.ProductId, data.GetProperty("productId").GetInt32());
        Assert.Equal("2026-09-20", data.GetProperty("startDate").GetString());
        Assert.Equal("2026-09-23", data.GetProperty("endDate").GetString());

        var variants = data.GetProperty("variants")
            .EnumerateArray()
            .ToDictionary(
                item => item.GetProperty("variantCode").GetString()!,
                item => new AvailabilityAssertion
                {
                    TotalInventory = item.GetProperty("totalInventory").GetInt32(),
                    AvailableInventory = item.GetProperty("availableInventory").GetInt32(),
                    IsAvailable = item.GetProperty("isAvailable").GetBoolean()
                });

        AssertAvailability(variants, "NOINV", total: 0, available: 0);
        AssertAvailability(variants, "OPEN", total: 1, available: 1);
        AssertAvailability(variants, "INSIDE", total: 1, available: 0);
        AssertAvailability(variants, "CONTAINS", total: 1, available: 0);
        AssertAvailability(variants, "BEGIN", total: 1, available: 0);
        AssertAvailability(variants, "END", total: 1, available: 0);
        AssertAvailability(variants, "BEFORE", total: 1, available: 1);
        AssertAvailability(variants, "AFTER", total: 1, available: 1);
        AssertAvailability(variants, "CANCELLED", total: 1, available: 1);
        AssertAvailability(variants, "COMPLETED", total: 1, available: 1);
        AssertAvailability(variants, "MAINT", total: 1, available: 0);
        AssertAvailability(variants, "MIXED", total: 2, available: 1);

        Assert.False(variants.ContainsKey("INACTIVE"));
    }

    private static void AssertAvailability(
        IReadOnlyDictionary<string, AvailabilityAssertion> variants,
        string variantCode,
        int total,
        int available)
    {
        Assert.True(variants.TryGetValue(variantCode, out var availability), $"Missing variant {variantCode}.");
        Assert.Equal(total, availability.TotalInventory);
        Assert.Equal(available, availability.AvailableInventory);
        Assert.Equal(available > 0, availability.IsAvailable);
    }

    private async Task<SeedResult> SeedAvailabilityCatalogAsync()
    {
        using var scope = _factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();
        var owner = await EnsureUserAsync(dbContext);

        var shop = new Shop
        {
            Name = $"Availability Shop {Guid.NewGuid():N}",
            OwnerUserId = owner.Id,
            Phone = "0901234567",
            Address = "123 Availability",
            IsActive = true
        };

        var product = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = "Availability Dress",
            Slug = $"availability-dress-{Guid.NewGuid():N}",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = true
        };
        var reservationSeeds = new List<ReservationSeed>();

        product.Variants.Add(new ProductVariant { Size = "XS", Color = "None", VariantCode = "NOINV", IsActive = true });
        AddVariant(product, reservationSeeds, "S", "Open", "OPEN", "AVAILABLE");
        AddVariant(product, reservationSeeds, "M", "Inside", "INSIDE", "AVAILABLE", ("RESERVED", "2026-09-21", "2026-09-22"));
        AddVariant(product, reservationSeeds, "M", "Contains", "CONTAINS", "AVAILABLE", ("ACTIVE", "2026-09-19", "2026-09-24"));
        AddVariant(product, reservationSeeds, "M", "Begin", "BEGIN", "AVAILABLE", ("RESERVED", "2026-09-18", "2026-09-21"));
        AddVariant(product, reservationSeeds, "M", "End", "END", "AVAILABLE", ("RESERVED", "2026-09-22", "2026-09-25"));
        AddVariant(product, reservationSeeds, "M", "Before", "BEFORE", "AVAILABLE", ("RESERVED", "2026-09-18", "2026-09-20"));
        AddVariant(product, reservationSeeds, "M", "After", "AFTER", "AVAILABLE", ("RESERVED", "2026-09-23", "2026-09-25"));
        AddVariant(product, reservationSeeds, "M", "Cancelled", "CANCELLED", "AVAILABLE", ("CANCELLED", "2026-09-21", "2026-09-22"));
        AddVariant(product, reservationSeeds, "M", "Completed", "COMPLETED", "AVAILABLE", ("COMPLETED", "2026-09-21", "2026-09-22"));
        AddVariant(product, reservationSeeds, "M", "Maintenance", "MAINT", "MAINTENANCE");
        AddVariant(product, reservationSeeds, "M", "Inactive", "INACTIVE", "AVAILABLE", isActive: false);

        var mixed = new ProductVariant
        {
            Size = "L",
            Color = "Mixed",
            VariantCode = "MIXED",
            IsActive = true,
            InventoryItems =
            [
                new ProductInventoryItem
                {
                    AssetCode = $"MIXED-OPEN-{Guid.NewGuid():N}",
                    Condition = "GOOD",
                    Status = "AVAILABLE"
                },
                new ProductInventoryItem
                {
                    AssetCode = $"MIXED-BLOCKED-{Guid.NewGuid():N}",
                    Condition = "GOOD",
                    Status = "AVAILABLE"
                }
            ]
        };
        reservationSeeds.Add(new ReservationSeed(
            mixed,
            mixed.InventoryItems.Last(),
            "RESERVED",
            "2026-09-21",
            "2026-09-22"));
        product.Variants.Add(mixed);

        var inactiveProduct = new DoRentMe.Api.Models.Product
        {
            Shop = shop,
            Name = "Inactive Availability Dress",
            Slug = $"inactive-availability-dress-{Guid.NewGuid():N}",
            Price1Day = 100000,
            Price3Day = 250000,
            ExtraDayPrice = 70000,
            PriceDeposit = 300000,
            CleaningCost = 10000,
            MaintenanceCost = 5000,
            IsActive = false
        };

        dbContext.Products.AddRange(product, inactiveProduct);
        await dbContext.SaveChangesAsync();

        foreach (var reservation in reservationSeeds)
        {
            await AddReservationAsync(
                dbContext,
                product,
                reservation.Variant,
                reservation.InventoryItem,
                reservation.Status,
                reservation.StartDate,
                reservation.EndDate);
        }

        return new SeedResult(product.Id, inactiveProduct.Id);
    }

    private static void AddVariant(
        DoRentMe.Api.Models.Product product,
        List<ReservationSeed> reservationSeeds,
        string size,
        string color,
        string variantCode,
        string inventoryStatus,
        (string Status, string StartDate, string EndDate)? reservation = null,
        bool isActive = true)
    {
        var inventoryItem = new ProductInventoryItem
        {
            AssetCode = $"{variantCode}-{Guid.NewGuid():N}",
            Condition = "GOOD",
            Status = inventoryStatus
        };

        var variant = new ProductVariant
        {
            Size = size,
            Color = color,
            VariantCode = variantCode,
            IsActive = isActive,
            InventoryItems = [inventoryItem]
        };

        if (reservation.HasValue)
        {
            reservationSeeds.Add(new ReservationSeed(
                variant,
                inventoryItem,
                reservation.Value.Status,
                reservation.Value.StartDate,
                reservation.Value.EndDate));
        }

        product.Variants.Add(variant);
    }

    private static async Task AddReservationAsync(
        DoRentMeDbContext dbContext,
        DoRentMe.Api.Models.Product product,
        ProductVariant variant,
        ProductInventoryItem inventoryItem,
        string status,
        string startDate,
        string endDate)
    {
        var start = DateOnly.Parse(startDate);
        var end = DateOnly.Parse(endDate);
        var order = new Order
        {
            OrderCode = $"AVAIL-{Guid.NewGuid():N}",
            ShopId = product.ShopId,
            CustomerName = "Availability Customer",
            CustomerPhone = "0901234567",
            ShippingAddress = "123 Availability",
            TotalRent = 100000,
            TotalDeposit = 300000,
            TotalDiscount = 0,
            StartDate = start,
            EndDate = end,
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
                    RentalStartDate = start,
                    RentalEndDate = end,
                    RentalDays = end.DayNumber - start.DayNumber,
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
            ProductInventoryItemId = inventoryItem.Id,
            StartDate = start,
            EndDate = end,
            Status = status
        });
        await dbContext.SaveChangesAsync();
    }

    private static async Task<User> EnsureUserAsync(DoRentMeDbContext dbContext)
    {
        var role = await dbContext.Roles.FirstAsync(r => r.Code == "LENDER");
        var user = new User
        {
            Name = "Availability Owner",
            Email = $"availability-owner-{Guid.NewGuid():N}@example.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Password123!"),
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

    private sealed record SeedResult(int ProductId, int InactiveProductId);

    private sealed record ReservationSeed(
        ProductVariant Variant,
        ProductInventoryItem InventoryItem,
        string Status,
        string StartDate,
        string EndDate);

    private sealed record AvailabilityAssertion
    {
        public int TotalInventory { get; init; }

        public int AvailableInventory { get; init; }

        public bool IsAvailable { get; init; }
    }
}
