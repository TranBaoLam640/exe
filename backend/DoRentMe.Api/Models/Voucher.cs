namespace DoRentMe.Api.Models;

public class Voucher
{
    public int Id { get; set; }
    public string Code { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string DiscountType { get; set; } = null!;
    public decimal DiscountValue { get; set; }
    public int RequiredPoints { get; set; }
    public decimal? MinOrderAmount { get; set; }
    public DateTime? StartAt { get; set; }
    public DateTime? EndAt { get; set; }
    public int? UsageLimit { get; set; }
    public int UsedCount { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<UserVoucher> UserVouchers { get; set; } = new List<UserVoucher>();
}
