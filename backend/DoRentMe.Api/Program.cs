using DoRentMe.Api.Common.Extensions;
using System.IdentityModel.Tokens.Jwt;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MySqlConnector;
using System.Text;
using System.Security.Claims;
var builder = WebApplication.CreateBuilder(args);

if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddLocalR2Defaults(builder.Environment.ContentRootPath);
    builder.Logging.ClearProviders();
    builder.Logging.AddConsole();
    builder.Logging.AddDebug();
}

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

if (builder.Environment.IsDevelopment())
{
    var mysqlConnection = new MySqlConnectionStringBuilder(connectionString);

    if (mysqlConnection.SslMode == MySqlSslMode.Preferred)
    {
        mysqlConnection.SslMode = MySqlSslMode.None;
        connectionString = mysqlConnection.ConnectionString;
    }
}

builder.Services.AddDbContext<DoRentMeDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 0))));
// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");

var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException(
        "JWT SecretKey not configured"
    );

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults.AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
{
    options.MapInboundClaims = false;

    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)
                ),

            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role,

            ClockSkew = TimeSpan.Zero
        };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<Microsoft.IdentityModel.Protocols.IConfigurationManager<Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>>(
    new Microsoft.IdentityModel.Protocols.ConfigurationManager<Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>(
        "https://accounts.google.com/.well-known/openid-configuration",
        new Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfigurationRetriever()));
builder.Services.AddSingleton<IGoogleTokenValidator, GoogleTokenValidator>();
builder.Services.AddScoped<ContactService>();
builder.Services.AddScoped<IBrandService, BrandService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IShopService, ShopService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<IOrderService, OrderService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IRefundService, RefundService>();
builder.Services.AddHttpClient<IEvidenceStorage, R2EvidenceStorage>();
builder.Services.AddScoped<IReturnInspectionService, ReturnInspectionService>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();
builder.Services.AddHttpClient<IAiGatewayService, AiGatewayService>();
builder.Services.Configure<PayOsOptions>(builder.Configuration.GetSection("PayOS"));
builder.Services.AddScoped<IPaymentGateway, PayOsPaymentGateway>();
builder.Services.AddScoped<IPaymentTransactionService, PaymentTransactionService>();

// Configure Distributed Cache (Redis for Production/K8s, In-Memory fallback for Development/Testing)
var redisConn = builder.Configuration.GetConnectionString("Redis");
var useRedis = builder.Configuration.GetValue("USE_REDIS", false) || (!builder.Environment.IsDevelopment() && !string.IsNullOrWhiteSpace(redisConn));

if (useRedis && !string.IsNullOrWhiteSpace(redisConn))
{
    builder.Services.AddStackExchangeRedisCache(options =>
    {
        options.Configuration = redisConn;
        options.InstanceName = "DoRentMe:";
    });
}
else
{
    builder.Services.AddDistributedMemoryCache();
}
builder.Services.AddSingleton<ICacheService, CacheService>();
builder.Services.AddScoped<ITryOnQuotaService, TryOnQuotaService>();

// Configure ASP.NET Core Rate Limiting
var tryOnRpm = builder.Configuration.GetValue("RateLimiting:TryOnRpm", 5);
var authRpm = builder.Configuration.GetValue("RateLimiting:AuthRpm", 10);
var chatRpm = builder.Configuration.GetValue("RateLimiting:ChatRpm", 20);
var generalRpm = builder.Configuration.GetValue("RateLimiting:GeneralRpm", 60);

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsync(
            "{\"error\":{\"code\":\"TOO_MANY_REQUESTS\",\"message\":\"Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau giây lát.\"}}",
            token);
    };

    options.AddPolicy("tryon-policy", httpContext =>
    {
        var clientKey = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.Request.Headers["X-Device-Fingerprint"].FirstOrDefault()
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return System.Threading.RateLimiting.RateLimitPartition.GetSlidingWindowLimiter(clientKey, _ => new System.Threading.RateLimiting.SlidingWindowRateLimiterOptions
        {
            PermitLimit = tryOnRpm,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 4,
            QueueLimit = 0
        });
    });

    options.AddPolicy("auth-policy", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "anonymous";
        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
        {
            PermitLimit = authRpm,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 0
        });
    });

    options.AddPolicy("chat-policy", httpContext =>
    {
        var clientKey = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? httpContext.Connection.RemoteIpAddress?.ToString()
            ?? "anonymous";

        return System.Threading.RateLimiting.RateLimitPartition.GetSlidingWindowLimiter(clientKey, _ => new System.Threading.RateLimiting.SlidingWindowRateLimiterOptions
        {
            PermitLimit = chatRpm,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 2,
            QueueLimit = 0
        });
    });

    options.GlobalLimiter = System.Threading.RateLimiting.PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "global";
        return System.Threading.RateLimiting.RateLimitPartition.GetFixedWindowLimiter(clientIp, _ => new System.Threading.RateLimiting.FixedWindowRateLimiterOptions
        {
            PermitLimit = generalRpm,
            Window = TimeSpan.FromMinutes(1),
            QueueLimit = 2
        });
    });
});

builder.Services.AddApiControllers();
builder.Services.AddOpenApiDocumentation();
builder.Services.AddFrontendCors(builder.Configuration);

var app = builder.Build();

app.UseCentralizedExceptionHandling();
app.UseOpenApiDocumentation();

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors("Frontend");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
public partial class Program
{
}
