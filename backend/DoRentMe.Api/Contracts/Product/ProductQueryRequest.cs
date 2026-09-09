using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductQueryRequest
{
    public string? Search { get; set; }

    public List<int> CategoryIds { get; set; } = new();

    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [Range(1, int.MaxValue)]
    public int? ShopId { get; set; }

    public string? Size { get; set; }

    public string? Color { get; set; }

    public string? Condition { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? MaxPrice { get; set; }

    public bool? InStock { get; set; }

    public string? SortBy { get; set; } = "createdAt";

    public string? SortDirection { get; set; } = "desc";

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}
