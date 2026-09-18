using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[AllowAnonymous]
[Route("api/payments/payos")]
public class PayOsWebhookController : ApiControllerBase
{
    private readonly IPaymentTransactionService _transactionService;

    public PayOsWebhookController(IPaymentTransactionService transactionService)
    {
        _transactionService = transactionService;
    }

    [HttpPost("webhook")]
    public async Task<IActionResult> Webhook([FromBody] PayOsWebhookRequest request, CancellationToken cancellationToken)
    {
        await _transactionService.ProcessPayOsWebhookAsync(request, cancellationToken);
        return Ok(new { code = "00", desc = "success" });
    }
}
