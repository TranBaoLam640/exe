FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY DoRentMe.Api.csproj .

RUN dotnet restore DoRentMe.Api.csproj

COPY . .

RUN dotnet publish DoRentMe.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore


FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "DoRentMe.Api.dll"]