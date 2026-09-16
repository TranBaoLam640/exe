using System.Security.Claims;
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Inventory;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

public class InventoryController : ApiControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("api/inventory")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> GetAll(
        [FromQuery] InventoryQueryRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.GetAllAsync(
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(inventory);
    }

    [HttpGet("api/inventory/{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.GetByIdAsync(
            id,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(inventory);
    }

    [HttpGet("api/products/{productId:int}/inventory")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> GetByProduct(
        int productId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.GetByProductAsync(
            productId,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(inventory);
    }

    [HttpGet("api/products/{productId:int}/availability")]
    public async Task<IActionResult> GetProductAvailability(
        int productId,
        [FromQuery] DateOnly? startDate,
        [FromQuery] DateOnly? endDate,
        CancellationToken cancellationToken)
    {
        var availability = await _inventoryService.GetProductAvailabilityAsync(
            productId,
            startDate,
            endDate,
            cancellationToken);

        return Success(availability);
    }

    [HttpPost("api/products/{productId:int}/variants/{variantId:int}/inventory")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Create(
        int productId,
        int variantId,
        [FromBody] InventoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.CreateAsync(
            productId,
            variantId,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return CreatedSuccess(inventory);
    }

    [HttpPut("api/inventory/{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] InventoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.UpdateAsync(
            id,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(inventory);
    }

    [HttpPut("api/inventory/{id:int}/status")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> UpdateStatus(
        int id,
        [FromBody] InventoryStatusRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var inventory = await _inventoryService.UpdateStatusAsync(
            id,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(inventory);
    }

    [HttpDelete("api/inventory/{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var deleted = await _inventoryService.DeleteAsync(
            id,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        if (!deleted)
        {
            throw new ApiException(
                ErrorCodes.InventoryItemNotFound,
                "Inventory item not found.",
                StatusCodes.Status404NotFound);
        }

        return NoContent();
    }

    private (int UserId, string Role) GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        return (userId, role);
    }
}
