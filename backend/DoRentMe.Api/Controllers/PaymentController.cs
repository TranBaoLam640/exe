using System.Security.Claims;
using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Authorize]
[Route("api/orders/{orderId:int}/payment")]
public class PaymentController : ApiControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomerPayment(int orderId, CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var payment = await _paymentService.GetCustomerPaymentAsync(userId, orderId, cancellationToken);
        return Success(payment);
    }
}
