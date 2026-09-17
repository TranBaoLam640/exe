using System.Security.Claims;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Order;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ApiControllerBase
{
    private readonly IOrderService _orderService;

    public AdminController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpGet("session")]
    [ProducesResponseType(
        typeof(ApiResponse<object>),
        StatusCodes.Status200OK)]
    public IActionResult GetSession()
    {
        var adminSession = new
        {
            UserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value,
            Email = User.FindFirst(ClaimTypes.Email)?.Value,
            Name = User.FindFirst(ClaimTypes.Name)?.Value,
            Role = User.FindFirst(ClaimTypes.Role)?.Value
        };

        return Success(adminSession);
    }

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(
        [FromQuery] AdminOrderFilters filters,
        CancellationToken cancellationToken)
    {
        var orders = await _orderService.GetAdminOrdersAsync(filters, cancellationToken);
        return Success(orders);
    }

    [HttpGet("orders/{id:int}")]
    public async Task<IActionResult> GetOrder(int id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetAdminOrderAsync(id, cancellationToken);
        return Success(order);
    }
}
