using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Brand;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/brands")]
public class BrandController : ApiControllerBase
{
    private readonly IBrandService _brandService;

    public BrandController(IBrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<BrandResponses>),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        BrandRequests request,
        CancellationToken cancellationToken)
    {
        var brand = await _brandService.CreateAsync(
            request,
            cancellationToken);

        var response = new BrandResponses
        {
            Id = brand.Id,
            Message = "Brand created successfully."
        };

        return CreatedSuccess(response);
    }

    [HttpGet]
    [ProducesResponseType(
    typeof(ApiResponse<List<BrandReadResponses>>),
    StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
    CancellationToken cancellationToken)
    {
        var brands = await _brandService.GetAllAsync(
            cancellationToken);

        var response = brands
            .Select(brand => new BrandReadResponses
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
                IsActive = brand.IsActive,
                CreatedAt = brand.CreatedAt,
                UpdatedAt = brand.UpdatedAt
            })
            .ToList();

        return Success(response);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(
    typeof(ApiResponse<BrandReadResponses>),
    StatusCodes.Status200OK)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
    int id,
    CancellationToken cancellationToken)
    {
        var brand = await _brandService.GetByIdAsync(
            id,
            cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        var response = new BrandReadResponses
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            IsActive = brand.IsActive,
            CreatedAt = brand.CreatedAt,
            UpdatedAt = brand.UpdatedAt
        };

        return Success(response);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(
    typeof(ApiResponse<BrandReadResponses>),
    StatusCodes.Status200OK)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
    int id,
    UpdateBrandRequest request,
    CancellationToken cancellationToken)
    {
        var brand = await _brandService.UpdateAsync(
            id,
            request,
            cancellationToken);

        var response = new BrandReadResponses
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            IsActive = brand.IsActive,
            CreatedAt = brand.CreatedAt,
            UpdatedAt = brand.UpdatedAt
        };

        return Success(response);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
    int id,
    CancellationToken cancellationToken)
    {
        await _brandService.DeleteAsync(
            id,
            cancellationToken);

        return NoContent();
    }
}
