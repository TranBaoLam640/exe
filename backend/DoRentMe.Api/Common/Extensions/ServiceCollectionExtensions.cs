namespace DoRentMe.Api.Common.Extensions;

using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Responses;
using Microsoft.AspNetCore.Mvc;

public static class ServiceCollectionExtensions
{
    
    public static IServiceCollection AddOpenApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

        return services;
    }
    
    public static IServiceCollection AddApiControllers(
        this IServiceCollection services)
    {
        services
            .AddControllers()
            .ConfigureApiBehaviorOptions(options =>
            {
                options.InvalidModelStateResponseFactory = context =>
                {
                    var details = context.ModelState
                        .Where(x => x.Value?.Errors.Count > 0)
                        .SelectMany(x =>
                            x.Value!.Errors.Select(error =>
                                new ApiErrorDetail
                                {
                                    Path = BuildPath(x.Key),
                                    Message = string.IsNullOrWhiteSpace(error.ErrorMessage)
                                        ? "The supplied value is invalid."
                                        : error.ErrorMessage
                                }))
                        .ToArray();

                    var response = new ApiErrorResponse
                    {
                        Error = new ApiError
                        {
                            Code = ErrorCodes.ValidationError,
                            Message = "One or more validation errors occurred.",
                            Details = details,
                            RequestId = context.HttpContext.TraceIdentifier
                        }
                    };

                    return new BadRequestObjectResult(response);
                };
            });

        return services;
    }

    public static IServiceCollection AddFrontendCors(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("Frontend", policy =>
            {
                var origins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
                if (origins is { Length: > 0 })
                {
                    policy.WithOrigins(origins)
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                }
            });
        });

        return services;
    }

     private static IReadOnlyList<string> BuildPath(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            return Array.Empty<string>();
        }

        var normalized = key.StartsWith("$.")
            ? key[2..]
            : key;

        return normalized
            .Split(
                '.',
                StringSplitOptions.RemoveEmptyEntries)
            .Select(ToCamelCase)
            .ToArray();
    }

    private static string ToCamelCase(string value)
    {
        if (string.IsNullOrEmpty(value))
        {
            return value;
        }

        if (value.Length == 1)
        {
            return value.ToLowerInvariant();
        }

        return char.ToLowerInvariant(value[0]) + value[1..];
    }
}
