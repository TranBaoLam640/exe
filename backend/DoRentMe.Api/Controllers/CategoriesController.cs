using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Category;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/categories")]
public class CategoryController : ApiControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryResponses>),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        CategoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.CreateAsync(
            request,
            cancellationToken);

        var response = new CategoryResponses
        {
            Id = category.Id,
            Message = "Category created successfully."
        };

        return CreatedSuccess(response);
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(ApiResponse<List<CategoryReadResponse>>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var categories = await _categoryService.GetAllAsync(
            cancellationToken);

        return Success(categories);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryReadResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetByIdAsync(
            id,
            cancellationToken);

        if (category == null)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return Success(category);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryReadResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Update(
        int id,
        CategoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.UpdateAsync(
            id,
            request,
            cancellationToken);

        if (category == null)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return Success(category);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _categoryService.DeleteAsync(
            id,
            cancellationToken);

        if (!deleted)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return NoContent();
    }
}