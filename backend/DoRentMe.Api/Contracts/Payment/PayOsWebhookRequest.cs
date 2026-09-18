using System.Text.Json.Serialization;

namespace DoRentMe.Api.Contracts.Payment;

public class PayOsWebhookRequest
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = null!;
    [JsonPropertyName("desc")]
    public string Description { get; set; } = null!;
    [JsonPropertyName("success")]
    public bool Success { get; set; }
    [JsonPropertyName("data")]
    public PayOsWebhookData Data { get; set; } = new();
    [JsonPropertyName("signature")]
    public string Signature { get; set; } = null!;
}

public class PayOsWebhookData
{
    [JsonPropertyName("orderCode")]
    public long OrderCode { get; set; }
    [JsonPropertyName("amount")]
    public decimal Amount { get; set; }
    [JsonPropertyName("reference")]
    public string? Reference { get; set; }
    [JsonPropertyName("paymentLinkId")]
    public string? PaymentLinkId { get; set; }
    [JsonPropertyName("code")]
    public string? Code { get; set; }
    [JsonPropertyName("desc")]
    public string? Description { get; set; }
    [JsonPropertyName("transactionDateTime")]
    public string? TransactionDateTime { get; set; }
}

public class PayOsCheckoutResponse
{
    public PaymentTransactionResponse Transaction { get; set; } = null!;
    public string CheckoutUrl { get; set; } = null!;
    public string? QrCode { get; set; }
}
