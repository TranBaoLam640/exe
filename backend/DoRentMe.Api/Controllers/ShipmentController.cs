using System.Security.Claims;
using DoRentMe.Api.Contracts.Shipment;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api")]
public class ShipmentController : ApiControllerBase
{
    private readonly IShipmentService _shipmentService;

    public ShipmentController(IShipmentService shipmentService)
    {
        _shipmentService = shipmentService;
    }

    [HttpGet("admin/shipments")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminShipments([FromQuery] ShipmentQueryRequest request, CancellationToken cancellationToken)
        => Success(await _shipmentService.GetAdminShipmentsAsync(request, cancellationToken));

    [HttpGet("admin/shipments/{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminShipment(int id, CancellationToken cancellationToken)
        => Success(await _shipmentService.GetAdminShipmentAsync(id, cancellationToken));

    [HttpGet("admin/orders/{orderId:int}/shipment")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminOrderShipment(int orderId, CancellationToken cancellationToken)
        => Success(await _shipmentService.GetAdminShipmentByOrderAsync(orderId, cancellationToken));

    [HttpPost("admin/orders/{orderId:int}/shipment")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create(int orderId, [FromBody] ShipmentCreateRequest request, CancellationToken cancellationToken)
        => CreatedSuccess(await _shipmentService.CreateAsync(GetUserId(), orderId, request, cancellationToken));

    [HttpPut("admin/shipments/{id:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(int id, [FromBody] ShipmentUpdateRequest request, CancellationToken cancellationToken)
        => Success(await _shipmentService.UpdateAsync(GetUserId(), id, request, cancellationToken));

    [HttpPut("admin/shipments/{id:int}/status")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] ShipmentStatusRequest request, CancellationToken cancellationToken)
        => Success(await _shipmentService.UpdateStatusAsync(GetUserId(), id, request, cancellationToken));

    [HttpGet("orders/{orderId:int}/shipment")]
    [Authorize]
    public async Task<IActionResult> GetCustomerShipment(int orderId, CancellationToken cancellationToken)
        => Success(await _shipmentService.GetCustomerShipmentAsync(GetUserId(), orderId, cancellationToken));

    private int GetUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
