namespace DoRentMe.Api.Common.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddOpenApiDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen();

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
}
