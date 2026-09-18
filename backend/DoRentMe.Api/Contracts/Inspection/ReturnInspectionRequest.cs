using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Inspection;

public class ReturnInspectionRequest
{
    [Required]
    [MaxLength(20)]
    public string ConditionAfterReturn { get; set; } = null!;
    public bool HasDamage { get; set; }

    [MaxLength(1000)]
    public string? DamageDescription { get; set; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal RecommendedDeduction { get; set; }

    [Required]
    public int ProductInventoryItemId { get; set; }
}
