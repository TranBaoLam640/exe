using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Common.Responses;

namespace DoRentMe.Api.Common.Middleware;

public sealed class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (ApiException exception)
        {
            await HandleApiExceptionAsync(context, exception);
        }
        catch (Exception exception)
        {
            await HandleUnexpectedExceptionAsync(context, exception);
        }
    }

    private static async Task HandleApiExceptionAsync(
        HttpContext context,
        ApiException exception)
    {
        context.Response.StatusCode = exception.StatusCode;
        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Code = exception.Code,
                Message = exception.Message,
                Details = exception.Details,
                RequestId = context.TraceIdentifier
            }
        };

        await context.Response.WriteAsJsonAsync(response);
    }

    private async Task HandleUnexpectedExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        _logger.LogError(
            exception,
            "Unhandled exception. RequestId: {RequestId}",
            context.TraceIdentifier);

        context.Response.StatusCode =
            StatusCodes.Status500InternalServerError;

        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse
        {
            Error = new ApiError
            {
                Code = ErrorCodes.InternalServerError,
                Message = "An unexpected error occurred.",
                Details = Array.Empty<ApiErrorDetail>(),
                RequestId = context.TraceIdentifier
            }
        };

        await context.Response.WriteAsJsonAsync(response);
    }
}