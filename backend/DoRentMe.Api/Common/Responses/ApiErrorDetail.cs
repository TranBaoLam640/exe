namespace DoRentMe.Api.Common.Responses;

public sealed class ApiErrorDetail
{
    public IReadOnlyList<string> Path { get; init; } = Array.Empty<string>();

    public string Message { get; init; } = string.Empty;
}