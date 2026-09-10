using System.Security.Claims;
using DoRentMe.Api.Contracts.Cart;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Authorize]
[Route("api/cart")]
public class CartController : ApiControllerBase
{
    private readonly ICartService _cartService;

    public CartController(ICartService cartService)
    {
        _cartService = cartService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCurrent(CancellationToken cancellationToken)
    {
        var cart = await _cartService.GetCurrentCartAsync(GetCurrentUserId(), cancellationToken);

        return Success(cart);
    }

    [HttpPost("items")]
    public async Task<IActionResult> AddItem(
        [FromBody] CartItemRequest request,
        CancellationToken cancellationToken)
    {
        var cart = await _cartService.AddItemAsync(GetCurrentUserId(), request, cancellationToken);

        return CreatedSuccess(cart);
    }

    [HttpPut("items/{itemId:int}")]
    public async Task<IActionResult> UpdateItem(
        int itemId,
        [FromBody] CartItemUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var cart = await _cartService.UpdateItemAsync(GetCurrentUserId(), itemId, request, cancellationToken);

        return Success(cart);
    }

    [HttpDelete("items/{itemId:int}")]
    public async Task<IActionResult> RemoveItem(
        int itemId,
        CancellationToken cancellationToken)
    {
        var cart = await _cartService.RemoveItemAsync(GetCurrentUserId(), itemId, cancellationToken);

        return Success(cart);
    }

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        var cart = await _cartService.ClearAsync(GetCurrentUserId(), cancellationToken);

        return Success(cart);
    }

    [HttpPost("discount-preview")]
    public async Task<IActionResult> PreviewDiscount(
        [FromBody] DiscountPreviewRequest request,
        CancellationToken cancellationToken)
    {
        var cart = await _cartService.PreviewDiscountAsync(GetCurrentUserId(), request, cancellationToken);

        return Success(cart);
    }

    private int GetCurrentUserId()
    {
        return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
    }
}
