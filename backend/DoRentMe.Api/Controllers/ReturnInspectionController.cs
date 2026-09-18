using System.Security.Claims;
using DoRentMe.Api.Contracts.Inspection;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Authorize]
public class ReturnInspectionController : ApiControllerBase
{
    private readonly IReturnInspectionService _inspectionService;

    public ReturnInspectionController(IReturnInspectionService inspectionService)
    {
        _inspectionService = inspectionService;
    }

    [HttpGet("api/admin/orders/{orderId:int}/inspections")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminInspections(int orderId, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.GetAdminInspectionsAsync(orderId, cancellationToken));
    }

    [HttpGet("api/admin/orders/{orderId:int}/inspection-summary")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminSummary(int orderId, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.GetSummaryAsync(orderId, requireComplete: false, cancellationToken: cancellationToken));
    }

    [HttpGet("api/admin/orders/{orderId:int}/inspection-assets")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminAssets(int orderId, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.GetAdminAssetsAsync(orderId, cancellationToken));
    }

    [HttpGet("api/admin/inspections/{inspectionId:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> GetAdminInspection(int inspectionId, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.GetAsync(inspectionId, cancellationToken));
    }

    [HttpPost("api/admin/orders/{orderId:int}/inspections")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Create(int orderId, [FromBody] ReturnInspectionRequest request, CancellationToken cancellationToken)
    {
        return CreatedSuccess(await _inspectionService.CreateAsync(CurrentUserId(), orderId, request, cancellationToken));
    }

    [HttpPut("api/admin/inspections/{inspectionId:int}")]
    [Authorize(Roles = "ADMIN")]
    public async Task<IActionResult> Update(int inspectionId, [FromBody] ReturnInspectionRequest request, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.UpdateAsync(CurrentUserId(), inspectionId, request, cancellationToken));
    }

    [HttpGet("api/orders/{orderId:int}/inspections")]
    public async Task<IActionResult> GetCustomerInspections(int orderId, CancellationToken cancellationToken)
    {
        return Success(await _inspectionService.GetCustomerInspectionsAsync(CurrentUserId(), orderId, cancellationToken));
    }

    private int CurrentUserId() => int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
}
