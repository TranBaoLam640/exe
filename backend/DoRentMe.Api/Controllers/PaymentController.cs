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
    private readonly IPaymentTransactionService _transactionService;

    public PaymentController(IPaymentService paymentService, IPaymentTransactionService transactionService)
    {
        _paymentService = paymentService;
        _transactionService = transactionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomerPayment(int orderId, CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var payment = await _paymentService.GetCustomerPaymentAsync(userId, orderId, cancellationToken);
        return Success(payment);
    }

    [HttpPost("payos")]
    public async Task<IActionResult> CreatePayOsPayment(int orderId, [FromBody] PayOsPaymentRequest request, CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return CreatedSuccess(await _transactionService.CreatePayOsPaymentAsync(userId, orderId, request, cancellationToken));
    }

    [HttpGet("transactions")]
    public async Task<IActionResult> GetCustomerTransactions(int orderId, CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Success(await _transactionService.GetCustomerTransactionsAsync(userId, orderId, cancellationToken));
    }
}
