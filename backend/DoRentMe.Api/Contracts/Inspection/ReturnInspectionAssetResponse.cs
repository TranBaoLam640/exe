namespace DoRentMe.Api.Contracts.Inspection;

public class ReturnInspectionAssetResponse
{
    public int ProductInventoryItemId { get; set; }
    public int OrderItemId { get; set; }
    public string AssetCode { get; set; } = null!;
    public string ProductName { get; set; } = null!;
    public string Size { get; set; } = null!;
    public string Color { get; set; } = null!;
    public string OperationalStatus { get; set; } = null!;
    public decimal DepositAllocation { get; set; }
    public ReturnInspectionResponse? Inspection { get; set; }
}
