namespace DoRentMe.Api.Contracts.Inspection;

public class InspectionSummaryResponse
{
    public decimal TotalDeposit { get; set; }
    public decimal TotalRecommendedDeduction { get; set; }
    public decimal RecommendedRefund { get; set; }
    public int RequiredAssetCount { get; set; }
    public int InspectedAssetCount { get; set; }
    public bool IsComplete { get; set; }
}
