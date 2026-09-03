namespace DoRentMe.Api.Common.Responses;

public sealed class ApiErrorResponse
{
    public bool Success { get; init; } = false;

    public ApiError Error { get; init; } = new();
}