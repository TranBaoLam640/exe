using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DoRentMe.Api.Controllers;

[Route("api/products")]
public class ProductController : ApiControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Create(
        [FromBody] ProductCreateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.CreateAsync(
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return CreatedSuccess(product);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        var products = await _productService.GetAllAsync(
            request,
            GetOptionalUserId(),
            cancellationToken);

        return Success(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.GetByIdAsync(
            id,
            GetOptionalUserId(),
            cancellationToken);

        return Success(product);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] ProductUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.UpdateAsync(
            id,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(product);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.DeleteAsync(
            id,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(product);
    }

    [HttpGet("{productId:int}/images")]
    public async Task<IActionResult> GetImages(
        int productId,
        CancellationToken cancellationToken)
    {
        var images = await _productService.GetImagesAsync(productId, cancellationToken);

        return Success(images);
    }

    [HttpPost("{productId:int}/images")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> AddImage(
        int productId,
        [FromBody] ProductImageRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var image = await _productService.AddImageAsync(
            productId,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return CreatedSuccess(image);
    }

    [HttpPut("{productId:int}/images/{imageId:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> UpdateImage(
        int productId,
        int imageId,
        [FromBody] ProductImageRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var image = await _productService.UpdateImageAsync(
            productId,
            imageId,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(image);
    }

    [HttpDelete("{productId:int}/images/{imageId:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> DeleteImage(
        int productId,
        int imageId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var deleted = await _productService.DeleteImageAsync(
            productId,
            imageId,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        if (!deleted)
        {
            throw new ApiException(
                ErrorCodes.NotFound,
                "Product image not found.",
                StatusCodes.Status404NotFound);
        }

        return NoContent();
    }

    [HttpPost("{id:int}/favorite")]
    [Authorize]
    public async Task<IActionResult> Favorite(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.FavoriteAsync(
            id,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(product);
    }

    [HttpDelete("{id:int}/favorite")]
    [Authorize]
    public async Task<IActionResult> Unfavorite(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.UnfavoriteAsync(
            id,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(product);
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites(
        [FromQuery] ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        var products = await _productService.GetFavoritesAsync(
            request,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(products);
    }

    private (int UserId, string Role) GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        return (userId, role);
    }

    private int? GetOptionalUserId()
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdValue, out var userId) ? userId : null;
    }
}
