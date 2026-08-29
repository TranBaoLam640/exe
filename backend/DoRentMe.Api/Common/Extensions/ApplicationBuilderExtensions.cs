using DoRentMe.Api.Common.Middleware;

namespace DoRentMe.Api.Common.Extensions;

public static class ApplicationBuilderExtensions
{
    public static IApplicationBuilder UseCentralizedExceptionHandling(this IApplicationBuilder app)
    {
        return app.UseMiddleware<ExceptionHandlingMiddleware>();
    }

    public static IApplicationBuilder UseOpenApiDocumentation(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        return app;
    }
}
