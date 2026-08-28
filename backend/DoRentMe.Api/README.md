# DoRentMe API

ASP.NET Core Web API skeleton for the DoRentMe backend.

## Scope

This project is a backend foundation only. It defines the API shape, service boundaries, placeholder implementations, and configuration slots for SQL Server, JWT authentication, Gemini, FASHN, and payment providers.

## Run

Install the .NET 8 SDK, then run:

```bash
dotnet restore
dotnet run --project backend/DoRentMe.Api
```

Swagger is available in development at `/swagger`.

## Configuration

Use user secrets, environment variables, or an untracked `appsettings.Local.json` for private values. Do not commit API keys, JWT secrets, database passwords, or payment credentials.
