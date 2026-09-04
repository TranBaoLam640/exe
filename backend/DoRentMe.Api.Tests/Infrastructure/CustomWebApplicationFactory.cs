using DoRentMe.Api.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using DoRentMe.Api.Models;
namespace DoRentMe.Api.Tests.Infrastructure;

public class CustomWebApplicationFactory
    : WebApplicationFactory<Program>
{
    private readonly string _databaseName = Guid.NewGuid().ToString();
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<DoRentMeDbContext>>();
            services.RemoveAll<DoRentMeDbContext>();

            services.AddDbContext<DoRentMeDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            var serviceProvider = services.BuildServiceProvider();

            using var scope = serviceProvider.CreateScope();

            var dbContext =
                scope.ServiceProvider
                    .GetRequiredService<DoRentMeDbContext>();

            dbContext.Database.EnsureCreated();

            // Seed CUSTOMER
            if (!dbContext.Roles.Any(r => r.Code == "CUSTOMER"))
            {
                dbContext.Roles.Add(
                    new Role
                    {
                        Code = "CUSTOMER",
                        Name = "Customer",
                        Description = "Customer role"
                    }
                );
            }

            // Seed LENDER
            if (!dbContext.Roles.Any(r => r.Code == "LENDER"))
            {
                dbContext.Roles.Add(
                    new Role
                    {
                        Code = "LENDER",
                        Name = "Lender",
                        Description = "Lender role"
                    }
                );
            }

            dbContext.SaveChanges();
        });
    }
}