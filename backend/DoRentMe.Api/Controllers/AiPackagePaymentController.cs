using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[AllowAnonymous]
[Route("api/ai-packages/payos")]
public class AiPackagePaymentController : ApiControllerBase
{
    private readonly IAiPackagePaymentService _service;

    public AiPackagePaymentController(IAiPackagePaymentService service)
    {
        _service = service;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] AiPackagePaymentCreateRequest request, CancellationToken cancellationToken)
    {
        return CreatedSuccess(await _service.CreatePaymentAsync(request.PackageId, cancellationToken));
    }

    [HttpGet("{orderCode:long}")]
    public async Task<IActionResult> GetStatus(long orderCode, CancellationToken cancellationToken)
    {
        return Success(await _service.GetStatusAsync(orderCode, cancellationToken));
    }

    [HttpPost("{orderCode:long}/claim")]
    public async Task<IActionResult> Claim(long orderCode, CancellationToken cancellationToken)
    {
        return Success(await _service.ClaimAsync(orderCode, cancellationToken));
    }
}

