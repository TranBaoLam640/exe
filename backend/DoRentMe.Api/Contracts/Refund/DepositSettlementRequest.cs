using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Refund;

public class DepositSettlementRequest
{
    [Range(typeof(decimal), "0", "79228162514264337593543950335")]
    public decimal RefundAmount { get; set; }

    [MaxLength(500)]
    public string? Reason { get; set; }
}
