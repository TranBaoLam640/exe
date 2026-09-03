namespace DoRentMe.Api.Common.Responses;

public sealed class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }

    private ApiResponse(bool success, T? data)
    {
        Success = success;
        Data = data;
    }

    public static ApiResponse<T> Ok(T data)
    {
        return new ApiResponse<T>(
            success: true,
            data: data);
    }
}