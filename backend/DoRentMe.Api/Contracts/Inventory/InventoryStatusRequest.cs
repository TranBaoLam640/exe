using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Inventory;

public class InventoryStatusRequest
{
    [Required(ErrorMessage = "Status is required.")]
    [MaxLength(50, ErrorMessage = "Status cannot exceed 50 characters.")]
    public string Status { get; set; } = null!;
}
