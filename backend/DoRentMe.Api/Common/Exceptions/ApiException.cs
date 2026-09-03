using DoRentMe.Api.Common.Responses;

namespace DoRentMe.Api.Common.Exceptions;

public class ApiException : Exception
{
    public string Code { get; }

    public int StatusCode { get; }

    public IReadOnlyList<ApiErrorDetail> Details { get; }

    public ApiException(
        string code,
        string message,
        int statusCode,
        IReadOnlyList<ApiErrorDetail>? details = null)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details ?? Array.Empty<ApiErrorDetail>();
    }
}