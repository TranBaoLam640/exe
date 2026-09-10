using System.Security.Claims;
using DoRentMe.Api.Contracts.Order;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Authorize]
[Route("api/orders")]
public class OrderController : ApiControllerBase
{
    private readonly IOrderService _orderService;

    public OrderController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout(
        [FromBody] CheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _orderService.CheckoutAsync(GetCurrentUserId(), request, cancellationToken);

        return CreatedSuccess(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(CancellationToken cancellationToken)
    {
        var orders = await _orderService.GetCustomerOrdersAsync(GetCurrentUserId(), cancellationToken);

        return Success(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var order = await _orderService.GetCustomerOrderAsync(GetCurrentUserId(), id, cancellationToken);

        return Success(order);
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
    {
        var order = await _orderService.CancelAsync(GetCurrentUserId(), id, cancellationToken);

        return Success(order);
    }

    [HttpPut("{id:int}/status")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] OrderStatusUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var order = await _orderService.UpdateStatusAsync(
            currentUser.UserId,
            currentUser.Role,
            id,
            request,
            cancellationToken);

        return Success(order);
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }

    private (int UserId, string Role) GetCurrentUser()
    {
        return (
            GetCurrentUserId(),
            User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty);
    }
}
