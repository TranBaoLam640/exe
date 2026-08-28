using DoRentMe.Api.Contracts;
using DoRentMe.Api.Services.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[ApiController]
[Route("api/cart")]
public sealed class CartController(ICartService cart) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        return Ok(await cart.GetAsync(cancellationToken));
    }

    [HttpPost("add")]
    public async Task<IActionResult> Add(AddCartItemRequest request, CancellationToken cancellationToken)
    {
        return Ok(await cart.AddAsync(request, cancellationToken));
    }

    [HttpPut("update/{productId:int}")]
    public async Task<IActionResult> Update(int productId, UpdateCartItemRequest request, CancellationToken cancellationToken)
    {
        var item = await cart.UpdateAsync(productId, request, cancellationToken);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpDelete("remove/{productId:int}")]
    public async Task<IActionResult> Remove(int productId, CancellationToken cancellationToken)
    {
        return await cart.RemoveAsync(productId, cancellationToken) ? NoContent() : NotFound();
    }
}
