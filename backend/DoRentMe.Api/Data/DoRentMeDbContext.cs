using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Data;

public class DoRentMeDbContext : DbContext
{
    public DoRentMeDbContext(DbContextOptions<DoRentMeDbContext> options)
        : base(options)
    {
    }
}