using System.Net;
using System.Net.Http.Json;
using DoRentMe.Api.Data;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
namespace DoRentMe.Api.Tests.Contact;

public class ContactApiTests
    : IDisposable
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly HttpClient _client;

    public ContactApiTests()
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
    public async Task Create_WithValidRequest_ReturnsCreated()
    {
        var request = new
        {
            name = "Nguyen Van A",
            email = "nguyenvana@gmail.com",
            phone = "0901234567",
            message = "Tôi muốn hỏi về dịch vụ."
        };

        var response = await _client.PostAsJsonAsync(
            "/api/contact",
            request);

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var contact = await dbContext.ContactMessages
            .SingleAsync();

        Assert.Equal("Nguyen Van A", contact.Name);
        Assert.Equal("nguyenvana@gmail.com", contact.Email);
        Assert.Equal("0901234567", contact.Phone);
        Assert.Equal("Tôi muốn hỏi về dịch vụ.", contact.Message);
        Assert.Equal("new", contact.Status);
        Assert.True(contact.Id > 0);
    }

    [Fact]
    public async Task Create_WithoutName_ReturnsBadRequest()
    {
        var request = new
        {
            email = "nguyenvana@gmail.com",
            phone = "0901234567",
            message = "Tôi muốn hỏi về dịch vụ."
        };

        var response = await _client.PostAsJsonAsync(
           "/api/contact",
           request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);
    }

    [Fact]
    public async Task Create_WithoutPhone_ReturnsCreated()
    {
        var request = new
        {
            name = "Nguyen Van A",
            email = "nguyenvana@gmail.com",
            message = "Tôi muốn hỏi về dịch vụ."
        };

        var response = await _client.PostAsJsonAsync(
            "/api/contact",
            request);

        Assert.Equal(
            HttpStatusCode.Created,
            response.StatusCode);

        using var scope = _factory.Services.CreateScope();

        var dbContext =
            scope.ServiceProvider.GetRequiredService<DoRentMeDbContext>();

        var contact = await dbContext.ContactMessages
            .SingleAsync();

        Assert.Equal("Nguyen Van A", contact.Name);
        Assert.Equal("nguyenvana@gmail.com", contact.Email);
        Assert.Equal("Tôi muốn hỏi về dịch vụ.", contact.Message);
        Assert.Equal("new", contact.Status);
        Assert.True(contact.Id > 0);
    }

    [Fact]
    public async Task Create_WithInvalidEmail_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Nguyen Van A",
            email = "abc",
            phone = "0901234567",
            message = "Tôi muốn hỏi về dịch vụ."
        };

        var response = await _client.PostAsJsonAsync(
            "/api/contact",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

    }

    [Fact]
    public async Task Create_WithoutMessage_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Nguyen Van A",
            email = "abc",
            phone = "0901234567",
        };

        var response = await _client.PostAsJsonAsync(
            "/api/contact",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);
    }
}