using System.Security.Claims;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Authorize]
[Route("api/orders/{orderId:int}/refunds")]
public class RefundController : ApiControllerBase
{
    private readonly IRefundService _refundService;

    public RefundController(IRefundService refundService)
    {
        _refundService = refundService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMine(int orderId, CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Success(await _refundService.GetCustomerRefundsAsync(userId, orderId, cancellationToken));
    }
}
