using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Data;
using DoRentMe.Api.Tests.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace DoRentMe.Api.Tests.Contact;

public class ContactApiTests : IDisposable
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

        // Kiểm tra response body
        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.True(
            data.GetProperty("id").GetInt32() > 0);

        Assert.Equal(
            "Contact message submitted successfully.",
            data.GetProperty("message").GetString());

        // Kiểm tra database
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

        // Có thể kiểm tra ID API trả về đúng ID DB
        Assert.Equal(
            contact.Id,
            data.GetProperty("id").GetInt32());
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

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.False(
            root.GetProperty("success").GetBoolean());

        var error = root.GetProperty("error");

        Assert.Equal(
            ErrorCodes.ValidationError,
            error.GetProperty("code").GetString());

        Assert.Equal(
            "One or more validation errors occurred.",
            error.GetProperty("message").GetString());

        Assert.False(
            string.IsNullOrWhiteSpace(
                error.GetProperty("requestId").GetString()));

        var details = error.GetProperty("details");

        Assert.True(details.GetArrayLength() > 0);

        Assert.Contains(
            details.EnumerateArray(),
            detail =>
                detail.GetProperty("path")[0].GetString() == "name");
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

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.True(
            root.GetProperty("success").GetBoolean());

        var data = root.GetProperty("data");

        Assert.True(
            data.GetProperty("id").GetInt32() > 0);

        Assert.Equal(
            "Contact message submitted successfully.",
            data.GetProperty("message").GetString());

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

        Assert.Equal(
            contact.Id,
            data.GetProperty("id").GetInt32());
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

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.False(
            root.GetProperty("success").GetBoolean());

        var error = root.GetProperty("error");

        Assert.Equal(
            ErrorCodes.ValidationError,
            error.GetProperty("code").GetString());

        Assert.False(
            string.IsNullOrWhiteSpace(
                error.GetProperty("requestId").GetString()));

        var details = error.GetProperty("details");

        Assert.Contains(
            details.EnumerateArray(),
            detail =>
                detail.GetProperty("path")[0].GetString() == "email");
    }

    [Fact]
    public async Task Create_WithoutMessage_ReturnsBadRequest()
    {
        var request = new
        {
            name = "Nguyen Van A",

            // Dùng email hợp lệ để test chỉ tập trung vào Message
            email = "nguyenvana@gmail.com",

            phone = "0901234567"
        };

        var response = await _client.PostAsJsonAsync(
            "/api/contact",
            request);

        Assert.Equal(
            HttpStatusCode.BadRequest,
            response.StatusCode);

        using var json = await ReadJsonAsync(response);

        var root = json.RootElement;

        Assert.False(
            root.GetProperty("success").GetBoolean());

        var error = root.GetProperty("error");

        Assert.Equal(
            ErrorCodes.ValidationError,
            error.GetProperty("code").GetString());

        var details = error.GetProperty("details");

        Assert.Contains(
            details.EnumerateArray(),
            detail =>
                detail.GetProperty("path")[0].GetString() == "message");
    }

    private static async Task<JsonDocument> ReadJsonAsync(
        HttpResponseMessage response)
    {
        var content = await response.Content.ReadAsStringAsync();

        return JsonDocument.Parse(content);
    }
}