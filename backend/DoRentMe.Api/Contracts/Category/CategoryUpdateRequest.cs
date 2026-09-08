namespace DoRentMe.Api.Contracts.Category;

public class CategoryUpdateRequest
{
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }
}