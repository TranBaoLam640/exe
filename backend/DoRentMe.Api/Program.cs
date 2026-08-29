using DoRentMe.Api.Common.Extensions;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApiDocumentation();
builder.Services.AddFrontendCors(builder.Configuration);

var app = builder.Build();

app.UseCentralizedExceptionHandling();
app.UseOpenApiDocumentation();
app.UseHttpsRedirection();
app.UseCors("Frontend");

app.MapControllers();

app.Run();
