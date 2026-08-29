namespace DoRentMe.Api.Models;

public class UserVoucher
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int VoucherId { get; set; }
    public string Status { get; set; } = "available";
    public DateTime AcquiredAt { get; set; } = DateTime.UtcNow;
    public DateTime? UsedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }

    public User User { get; set; } = null!;
    public Voucher Voucher { get; set; } = null!;
}
