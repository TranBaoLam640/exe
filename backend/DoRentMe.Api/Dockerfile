FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY DoRentMe.Api.csproj .

RUN dotnet restore DoRentMe.Api.csproj

COPY . .

RUN dotnet publish DoRentMe.Api.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

RUN dotnet tool install --global dotnet-ef --version 8.0.30

ENV PATH="${PATH}:/root/.dotnet/tools"

RUN ASPNETCORE_ENVIRONMENT=Production \
    ConnectionStrings__DefaultConnection="Server=localhost;Port=3306;Database=dorentme;User=root;Password=dummy;" \
    dotnet ef migrations bundle \
    --project DoRentMe.Api.csproj \
    --startup-project DoRentMe.Api.csproj \
    --configuration Release \
    --output /app/efbundle

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

WORKDIR /app

COPY --from=build /app/publish .
COPY --from=build /app/efbundle ./efbundle

RUN chmod +x ./efbundle

ENV ASPNETCORE_URLS=http://+:8080

EXPOSE 8080

ENTRYPOINT ["dotnet", "DoRentMe.Api.dll"]