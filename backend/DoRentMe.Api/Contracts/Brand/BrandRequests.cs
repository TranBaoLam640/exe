using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Brand;

public class BrandRequests
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}