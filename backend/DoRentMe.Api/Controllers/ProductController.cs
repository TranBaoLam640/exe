using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

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
    public async Task<IActionResult> Create(
        [FromBody] ProductCreateRequest request,
        CancellationToken cancellationToken)
    {
        var product = await _productService.CreateAsync(
            request,
            cancellationToken);

        return CreatedSuccess(product);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
    CancellationToken cancellationToken)
    {
        var products = await _productService.GetAllAsync(
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
            cancellationToken);

        return Success(product);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
    int id,
    [FromBody] ProductUpdateRequest request,
    CancellationToken cancellationToken)
    {
        var product = await _productService.UpdateAsync(
            id,
            request,
            cancellationToken);

        return Success(product);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
    int id,
    CancellationToken cancellationToken)
    {
        var product = await _productService.DeleteAsync(
            id,
            cancellationToken);

        return Success(product);
    }
}