using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Brand;

public class UpdateBrandRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }
}