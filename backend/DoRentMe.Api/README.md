# DoRentMe.Api

Clean ASP.NET Core Web API foundation for DoRentMe Phase 1.

This backend was recreated from scratch and intentionally contains only the initial API foundation:

- ASP.NET Core controller pipeline
- Swagger in development
- frontend CORS configuration
- SQL Server EF Core context
- domain entities aligned with `database/schema.sql`
- `GET /api/health`

Business services, authentication, AI integrations, payment flows, and feature endpoints should be added only when their phase-specific contracts are defined.
