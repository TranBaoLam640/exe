using System.Security.Claims;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Payment;
using DoRentMe.Api.Contracts.Order;
using DoRentMe.Api.Contracts.Refund;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/admin")]
[Authorize(Roles = "ADMIN")]
public class AdminController : ApiControllerBase
{
    private readonly IOrderService _orderService;
    private readonly IPaymentService _paymentService;
    private readonly IPaymentTransactionService _transactionService;
    private readonly IRefundService _refundService;

    public AdminController(IOrderService orderService, IPaymentService paymentService, IRefundService refundService, IPaymentTransactionService transactionService)
    {
        _orderService = orderService;
        _paymentService = paymentService;
        _refundService = refundService;
        _transactionService = transactionService;
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

    [HttpGet("orders/{orderId:int}/payment")]
    public async Task<IActionResult> GetOrderPayment(int orderId, CancellationToken cancellationToken)
    {
        var payment = await _paymentService.GetAdminPaymentAsync(orderId, cancellationToken);
        return Success(payment);
    }

    [HttpPut("payments/{paymentId:int}/status")]
    public async Task<IActionResult> UpdatePaymentStatus(
        int paymentId,
        [FromBody] PaymentStatusUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var payment = await _paymentService.UpdateStatusAsync(adminUserId, paymentId, request, cancellationToken);
        return Success(payment);
    }

    [HttpGet("payments/{paymentId:int}/transactions")]
    public async Task<IActionResult> GetPaymentTransactions(int paymentId, CancellationToken cancellationToken)
    {
        return Success(await _transactionService.GetAdminTransactionsAsync(paymentId, cancellationToken));
    }

    [HttpGet("payment-transactions/{transactionId:int}")]
    public async Task<IActionResult> GetPaymentTransaction(int transactionId, CancellationToken cancellationToken)
    {
        return Success(await _transactionService.GetAdminTransactionAsync(transactionId, cancellationToken));
    }

    [HttpGet("refunds")]
    public async Task<IActionResult> GetRefunds([FromQuery] RefundFilters filters, CancellationToken cancellationToken)
    {
        return Success(await _refundService.GetAdminRefundsAsync(filters, cancellationToken));
    }

    [HttpGet("refunds/{refundId:int}")]
    public async Task<IActionResult> GetRefund(int refundId, CancellationToken cancellationToken)
    {
        return Success(await _refundService.GetAdminRefundAsync(refundId, cancellationToken));
    }

    [HttpPut("refunds/{refundId:int}/status")]
    public async Task<IActionResult> UpdateRefundStatus(int refundId, [FromBody] RefundStatusUpdateRequest request, CancellationToken cancellationToken)
    {
        var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return Success(await _refundService.UpdateStatusAsync(adminUserId, refundId, request, cancellationToken));
    }

    [HttpPost("orders/{orderId:int}/deposit-settlement")]
    public async Task<IActionResult> CreateDepositSettlement(int orderId, [FromBody] DepositSettlementRequest request, CancellationToken cancellationToken)
    {
        var adminUserId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        return CreatedSuccess(await _refundService.CreateDepositSettlementAsync(adminUserId, orderId, request, cancellationToken));
    }
}
