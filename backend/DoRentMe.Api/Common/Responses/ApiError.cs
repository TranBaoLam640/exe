namespace DoRentMe.Api.Common.Responses;

public sealed class ApiError
{
    public string Code { get; init; } = string.Empty;

    public string Message { get; init; } = string.Empty;

    public IReadOnlyList<ApiErrorDetail> Details { get; init; }
        = Array.Empty<ApiErrorDetail>();

    public string RequestId { get; init; } = string.Empty;
}