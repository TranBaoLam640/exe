using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Inventory;

public class InventoryCreateRequest
{
    [Required(ErrorMessage = "AssetCode is required.")]
    [MaxLength(100, ErrorMessage = "AssetCode cannot exceed 100 characters.")]
    public string AssetCode { get; set; } = null!;

    [Required(ErrorMessage = "Condition is required.")]
    [MaxLength(50, ErrorMessage = "Condition cannot exceed 50 characters.")]
    public string Condition { get; set; } = "GOOD";

    [MaxLength(500, ErrorMessage = "Notes cannot exceed 500 characters.")]
    public string? Notes { get; set; }

    public DateTime? AcquiredAt { get; set; }
}
