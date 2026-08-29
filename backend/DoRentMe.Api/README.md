# DoRentMe.Api

Database-agnostic ASP.NET Core Web API foundation for DoRentMe Phase 1.

This backend was recreated from scratch and intentionally contains only the initial API foundation:

- solution structure
- ASP.NET Core controller pipeline
- Swagger in development
- frontend CORS configuration
- built-in ASP.NET Core logging
- centralized exception handling
- environment-aware configuration
- `GET /api/health`
- placeholder folders for contracts, data, models, and services
- separate test project scaffold

There is intentionally no database implementation in Phase 1. SQL Server, MySQL, EF Core database providers, DbContext, entities, migrations, and connection strings belong to later phase-specific work.
