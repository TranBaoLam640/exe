# DoRentMe Deploy Context for ChatGPT

Generated from repository files under D:\exe. Secret-bearing local env files are intentionally excluded or summarized.

## Excluded / Sanitized

- `.env.local`: contains local `GEMINI_API_KEY` and `FASHN_API_KEY`; values omitted for security.
- `.env.r2.local`: contains local Cloudflare R2 credentials; values omitted for security.
- `dorentme-2026-09-14.sql.gz`: binary database dump, not expanded here.
- `deploy_structure.docx`: binary Word document, not expanded here.
- `frontend/package-lock.json`: dependency lockfile, omitted to keep deploy context readable; include separately only if dependency resolution is being debugged.

## Files Included

- `vercel.json`
- `.gitignore`
- `.env.r2.example`
- `frontend/.env.example`
- `frontend/.env.development`
- `frontend/.env.production`
- `frontend/package.json`
- `frontend/vite.config.js`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `frontend/README.md`
- `backend/DoRentMe.sln`
- `backend/DoRentMe.Api/DoRentMe.Api.csproj`
- `backend/DoRentMe.Api/Dockerfile`
- `backend/DoRentMe.Api/appsettings.json`
- `backend/DoRentMe.Api/Program.cs`
- `backend/DoRentMe.Api/README.md`
- `api/chat.js`
- `api/tryon.js`
- `k8s/api-ingress.yaml`
- `k8s/backend-hpa.yaml`
- `k8s/backend-service.yaml`
- `k8s/backend.yaml`
- `k8s/frontend-service.yaml`
- `k8s/frontend.yaml`
- `k8s/ingress.yaml`
- `k8s/migration-job.yaml`
- `k8s/mysql.yaml`
- `database/schema.sql`
- `database/seed-legacy-catalog.mysql.sql`
- `tools/r2/README.md`
- `tools/r2/r2-assets.js`
- `tools/r2/scan-assets.js`
- `tools/r2/upload-assets.js`
- `tools/r2/verify-assets.js`
- `tools/r2/asset-migration-manifest.json`
- `tools/catalog/README.md`
- `tools/catalog/generate-legacy-catalog-seed.js`

## `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "installCommand": "npm install --prefix frontend",
  "buildCommand": "npm run build --prefix frontend",
  "outputDirectory": "frontend/dist",
  "cleanUrls": false,
  "trailingSlash": false,
  "redirects": [
    { "source": "/index.html", "destination": "/", "permanent": false },
    { "source": "/about.html", "destination": "/about", "permanent": false },
    { "source": "/contact.html", "destination": "/contact", "permanent": false },
    { "source": "/policy.html", "destination": "/policy", "permanent": false },
    { "source": "/terms.html", "destination": "/terms", "permanent": false },
    { "source": "/tutorial.html", "destination": "/tutorial", "permanent": false },
    { "source": "/loyalty.html", "destination": "/loyalty", "permanent": false },
    { "source": "/news.html", "destination": "/news", "permanent": false },
    { "source": "/news_detail.html", "destination": "/news_detail", "permanent": false },
    { "source": "/shop.html", "destination": "/shop", "permanent": false },
    { "source": "/productDetail.html", "destination": "/product", "permanent": false },
    { "source": "/cart.html", "destination": "/cart", "permanent": false },
    { "source": "/checkout.html", "destination": "/checkout", "permanent": false },
    { "source": "/login.html", "destination": "/login", "permanent": false },
    { "source": "/register.html", "destination": "/register", "permanent": false },
    { "source": "/orders.html", "destination": "/orders", "permanent": false },
    { "source": "/order-tracking.html", "destination": "/order-tracking", "permanent": false },
    { "source": "/shop-admin.html", "destination": "/admin", "permanent": false },
    { "source": "/chatbotAI.html", "destination": "/chatbot", "permanent": false },
    { "source": "/ai-tryon.html", "destination": "/ai-tryon", "permanent": false }
  ],
  "rewrites": [
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/image/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

## `.gitignore`

```text
.env.r2.local
.env*.local
!.env.r2.example
.history/
```

## `.env.r2.example`

```dotenv
# Cloudflare account ID.
R2_ACCOUNT_ID=

# Cloudflare R2 S3 access key ID.
R2_ACCESS_KEY_ID=

# Cloudflare R2 S3 secret access key.
R2_SECRET_ACCESS_KEY=

# Target Cloudflare R2 bucket for static frontend assets.
R2_BUCKET=dorentme-assets

# Public r2.dev or custom-domain base URL for browser asset delivery.
R2_PUBLIC_BASE_URL=
```

## `frontend/.env.example`

```dotenv
VITE_ASSET_BASE_URL=
```

## `frontend/.env.development`

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

## `frontend/.env.production`

```dotenv
VITE_ASSET_BASE_URL=https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev
VITE_API_BASE_URL=https://api.dorentme.com
```

## `frontend/package.json`

```json
{
  "name": "dorentme-react-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "npm run check:asset-url && npm run check:production-asset-base && npm run check:chatbot && npm run check:tryon && npm run validate:catalog && npm run validate:legacy-cart && npm run check:cutover-readiness",
    "check": "npm run check:asset-url && npm run check:production-asset-base && npm run check:chatbot && npm run check:tryon && npm run validate:catalog && npm run validate:legacy-cart && npm run check:cutover-readiness && npm run build",
    "check:asset-url": "node scripts/check-asset-url.js",
    "check:production-asset-base": "node scripts/check-production-asset-base.js",
    "check:chatbot": "node scripts/check-chatbot.js",
    "check:tryon": "node scripts/check-tryon.js",
    "check:cutover-readiness": "node scripts/check-cutover-readiness.js",
    "validate:catalog": "node scripts/validate-catalog.js",
    "validate:legacy-cart": "node scripts/validate-legacy-cart.js"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^5.0.0",
    "axios": "^1.20.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "vite": "^7.0.0"
  }
}
```

## `frontend/vite.config.js`

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

## `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ARG VITE_ASSET_BASE_URL

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_ASSET_BASE_URL=$VITE_ASSET_BASE_URL

RUN npm run build


FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

## `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## `frontend/README.md`

```md
# DoRentMe React Frontend

This directory contains the Phase 1 Vite + React foundation for the DoRentMe frontend migration.

The legacy static site remains at the repository root and should stay available as the migration reference until later phases move pages into React.

## Commands

```bash
npm install
npm run dev
npm run build
npm run check:asset-url
```

## Environment

Create `frontend/.env.local` for local-only settings when needed.

```env
VITE_ASSET_BASE_URL=
```

`VITE_ASSET_BASE_URL` is public browser configuration for future Cloudflare R2 image URLs. Do not add server-side secrets such as `GEMINI_API_KEY` or `FASHN_API_KEY` to Vite environment files.

## Migration Notes

Phase 1 does not migrate business pages. Future phases should move legacy page CSS alongside each React page first, then gradually split shared styles from page-specific styles.

## R2 Assets

Phase 2B adds a lightweight runtime map at `src/assets/asset-map.json` and an `imageUrl()` helper at `src/assets/imageUrl.js`. React pages can pass a legacy source path such as `image/ao_dai/d.chic_xuan_vien.jpg`; the helper resolves the canonical R2 key and then applies the public `VITE_ASSET_BASE_URL` through `assetUrl()`.

The root legacy static site still uses local image files. Local assets are intentionally retained for coexistence and rollback while React pages migrate incrementally.
```

## `backend/DoRentMe.sln`

```text
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{9A19103F-16F7-4668-BE54-9A1E7A4A7F755}") = "DoRentMe.Api", "DoRentMe.Api\DoRentMe.Api.csproj", "{A1F5E3B8-624E-4685-9A2B-0DBD7E6D88E1}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "DoRentMe.Api.Tests", "DoRentMe.Api.Tests\DoRentMe.Api.Tests.csproj", "{B20F703E-DAA9-44DA-812A-BF4E96CD2E4D}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{A1F5E3B8-624E-4685-9A2B-0DBD7E6D88E1}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{A1F5E3B8-624E-4685-9A2B-0DBD7E6D88E1}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{A1F5E3B8-624E-4685-9A2B-0DBD7E6D88E1}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{A1F5E3B8-624E-4685-9A2B-0DBD7E6D88E1}.Release|Any CPU.Build.0 = Release|Any CPU
		{B20F703E-DAA9-44DA-812A-BF4E96CD2E4D}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{B20F703E-DAA9-44DA-812A-BF4E96CD2E4D}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{B20F703E-DAA9-44DA-812A-BF4E96CD2E4D}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{B20F703E-DAA9-44DA-812A-BF4E96CD2E4D}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
EndGlobal
```

## `backend/DoRentMe.Api/DoRentMe.Api.csproj`

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <UserSecretsId>04fae945-dcf7-4eed-8d58-a84ee9110da3</UserSecretsId>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="BCrypt.Net-Next" Version="4.2.0" />
    <PackageReference Include="Microsoft.AspNetCore.Authentication.JwtBearer" Version="8.0.11" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.30" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.30">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="Microsoft.EntityFrameworkCore.Relational" Version="8.0.30" />
    <PackageReference Include="payOS" Version="2.1.0" />
    <PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.3" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
    <PackageReference Include="System.IdentityModel.Tokens.Jwt" Version="8.22.0" />
  </ItemGroup>
</Project>
```

## `backend/DoRentMe.Api/Dockerfile`

```dockerfile
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
```

## `backend/DoRentMe.Api/appsettings.json`

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=127.0.0.1;Port=3307;Database=dorentme;Uid=dorentme;Pwd=your_password_here;"
  },

  "JwtSettings": {
    "SecretKey": "YourSuperSecretKeyThatIsAtLeast32CharactersLong!",
    "Issuer": "DoRentMe",
    "Audience": "DoRentMe",
    "ExpiryMinutes": "1440"
  },
  "Cors": {
    "AllowedOrigins": [
      "http://localhost:5173"
    ]
  },
  "PayOS": {
    "ClientId": "",
    "ApiKey": "",
    "ChecksumKey": "",
    "ReturnUrl": "http://localhost:5173/payment/payos/return?orderId={orderId}",
    "CancelUrl": "http://localhost:5173/payment/payos/cancel?orderId={orderId}"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
```

## `backend/DoRentMe.Api/Program.cs`

```csharp
using DoRentMe.Api.Common.Extensions;
using System.IdentityModel.Tokens.Jwt;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Security.Claims;
var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' was not found.");

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
builder.Services.AddScoped<IReturnInspectionService, ReturnInspectionService>();
builder.Services.AddScoped<IShipmentService, ShipmentService>();
builder.Services.Configure<PayOsOptions>(builder.Configuration.GetSection("PayOS"));
builder.Services.AddScoped<IPaymentGateway, PayOsPaymentGateway>();
builder.Services.AddScoped<IPaymentTransactionService, PaymentTransactionService>();
builder.Services.AddApiControllers();
builder.Services.AddOpenApiDocumentation();
builder.Services.AddFrontendCors(builder.Configuration);

var app = builder.Build();

app.UseCentralizedExceptionHandling();
app.UseOpenApiDocumentation();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
public partial class Program
{
}
```

## `backend/DoRentMe.Api/README.md`

```md
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
```

## `api/chat.js`

```js
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { messages, system, generationConfig } = req.body;

    // Debug: ki盻ノ tra env var
    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: { message: 'GEMINI_API_KEY chﾆｰa ﾄ柁ｰ盻｣c c蘯･u hﾃｬnh trﾃｪn server' } });
    }

    if (!messages || !system) {
        return res.status(400).json({ error: 'Missing messages or system prompt' });
    }

    try {
        const body = {
            system_instruction: { parts: [{ text: system }] },
            contents: messages
        };
        if (generationConfig) body.generationConfig = generationConfig;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
    }
}
```

## `api/tryon.js`

```js
const FASHN_BASE = 'https://api.fashn.ai/v1';

// Dﾃｹng FASHN AI (Try-On Max) qua REST API tr盻ｱc ti蘯ｿp 窶・b蘯･t ﾄ黛ｻ渡g b盻・v盻嬖 polling,
// vﾃｬ model AI th盻ｭ ﾄ黛ｻ・thﾆｰ盻拵g m蘯･t vﾃi ch盻･c giﾃ｢y, d盻・vﾆｰ盻｣t timeout c盻ｧa serverless function.
export default async function handler(req, res) {
    if (!process.env.FASHN_API_KEY) {
        return res.status(500).json({ error: { message: 'FASHN_API_KEY chﾆｰa ﾄ柁ｰ盻｣c c蘯･u hﾃｬnh trﾃｪn server' } });
    }
    const authHeader = { 'Authorization': `Bearer ${process.env.FASHN_API_KEY}` };

    try {
        if (req.method === 'POST') {
            const { humanImage, garmentImageUrl } = req.body || {};
            if (!humanImage || !garmentImageUrl) {
                return res.status(400).json({ error: { message: 'Thi蘯ｿu 蘯｣nh khﾃ｡ch hﾃng ho蘯ｷc 蘯｣nh s蘯｣n ph蘯ｩm' } });
            }

            const response = await fetch(FASHN_BASE + '/run', {
                method: 'POST',
                headers: { ...authHeader, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_name: 'tryon-max',
                    inputs: {
                        model_image: humanImage,
                        product_image: garmentImageUrl,
                        resolution: '1k'
                    }
                })
            });
            const data = await response.json();
            if (!response.ok || data.error) {
                return res.status(response.ok ? 400 : response.status).json({
                    error: { message: data.error || 'Khﾃｴng g盻ｭi ﾄ柁ｰ盻｣c yﾃｪu c蘯ｧu t盻嬖 FASHN AI.' }
                });
            }
            return res.status(200).json({ requestId: data.id });
        }

        if (req.method === 'GET') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ error: { message: 'Thi蘯ｿu request id' } });

            const response = await fetch(`${FASHN_BASE}/status/${id}`, { headers: authHeader });
            const data = await response.json();
            if (!response.ok) {
                return res.status(response.status).json({ error: { message: data.error || 'Khﾃｴng ki盻ノ tra ﾄ柁ｰ盻｣c tr蘯｡ng thﾃ｡i x盻ｭ lﾃｽ.' } });
            }
            if (data.error) {
                return res.status(400).json({ error: { message: data.error } });
            }

            // Chu蘯ｩn hﾃｳa response v盻・1 ﾄ黛ｻ杵h d蘯｡ng chung cho frontend
            const STATUS_MAP = {
                starting: 'IN_QUEUE',
                in_queue: 'IN_QUEUE',
                processing: 'IN_PROGRESS',
                completed: 'COMPLETED',
                failed: 'FAILED'
            };
            const normalized = { status: STATUS_MAP[data.status] || data.status };
            if (data.status === 'completed' && Array.isArray(data.output) && data.output[0]) {
                normalized.image = { url: data.output[0] };
            }
            return res.status(200).json(normalized);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (err) {
        res.status(500).json({ error: { message: 'Internal server error: ' + err.message } });
    }
}
```

## `k8s/api-ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dorentme-api
  namespace: dorentme

  annotations:
    nginx.ingress.kubernetes.io/limit-rps: "10"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "2"

spec:
  ingressClassName: nginx

  rules:
    - host: api-dorentme.wdchocopie.id.vn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: backend
                port:
                  number: 80
```

## `k8s/backend-hpa.yaml`

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend
  namespace: dorentme

spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend

  minReplicas: 2
  maxReplicas: 5

  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 60

  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
        - type: Pods
          value: 2
          periodSeconds: 60

    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Pods
          value: 1
          periodSeconds: 60
```

## `k8s/backend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: dorentme

spec:
  type: ClusterIP

  selector:
    app: backend

  ports:
    - name: http
      port: 80
      targetPort: 8080
```

## `k8s/backend.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: dorentme

spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1

  minReadySeconds: 5
  progressDeadlineSeconds: 600

  selector:
    matchLabels:
      app: backend

  template:
    metadata:
      labels:
        app: backend

    spec:
      imagePullSecrets:
        - name: ghcr-secret

      containers:
        - name: backend
          image: BACKEND_IMAGE_PLACEHOLDER
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 8080

          envFrom:
            - configMapRef:
                name: backend-config

            - secretRef:
                name: backend-secret

          resources:
            requests:
              cpu: 100m
              memory: 128Mi

            limits:
              cpu: 500m
              memory: 512Mi

          startupProbe:
            httpGet:
              path: /api/health
              port: 8080
            periodSeconds: 5
            failureThreshold: 30

          readinessProbe:
            httpGet:
              path: /api/health
              port: 8080
            periodSeconds: 5
            failureThreshold: 3

          livenessProbe:
            httpGet:
              path: /api/health
              port: 8080
            periodSeconds: 20
            failureThreshold: 3
```

## `k8s/frontend-service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: dorentme

spec:
  type: ClusterIP

  selector:
    app: frontend

  ports:
    - name: http
      port: 80
      targetPort: 80
```

## `k8s/frontend.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: dorentme

spec:
  replicas: 2

  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1

  minReadySeconds: 5
  progressDeadlineSeconds: 600

  selector:
    matchLabels:
      app: frontend

  template:
    metadata:
      labels:
        app: frontend

    spec:
      imagePullSecrets:
        - name: ghcr-secret

      containers:
        - name: frontend
          image: FRONTEND_IMAGE_PLACEHOLDER
          imagePullPolicy: IfNotPresent

          ports:
            - name: http
              containerPort: 80

          resources:
            requests:
              cpu: 50m
              memory: 64Mi

            limits:
              cpu: 250m
              memory: 256Mi

          startupProbe:
            httpGet:
              path: /
              port: 80
            periodSeconds: 5
            failureThreshold: 20

          readinessProbe:
            httpGet:
              path: /
              port: 80
            periodSeconds: 5
            failureThreshold: 3

          livenessProbe:
            httpGet:
              path: /
              port: 80
            periodSeconds: 20
            failureThreshold: 3
```

## `k8s/ingress.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: dorentme
  namespace: dorentme

spec:
  ingressClassName: nginx

  rules:
    - host: dorentme.wdchocopie.id.vn
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: frontend
                port:
                  number: 80
```

## `k8s/migration-job.yaml`

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: backend-migration
  namespace: dorentme

spec:
  backoffLimit: 1

  template:
    metadata:
      labels:
        app: backend-migration

    spec:
      restartPolicy: Never

      imagePullSecrets:
        - name: ghcr-secret

      containers:
        - name: migration
          image: BACKEND_IMAGE_PLACEHOLDER
          imagePullPolicy: IfNotPresent

          envFrom:
            - secretRef:
                name: backend-secret

          command:
            - /bin/sh
            - -c

          args:
            - |
              echo "Starting EF Core migration..."
              ./efbundle --connection "$ConnectionStrings__DefaultConnection"
              echo "Migration completed."
```

## `k8s/mysql.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: mysql
  namespace: dorentme
spec:
  clusterIP: None
  selector:
    app: mysql
  ports:
    - name: mysql
      port: 3306
      targetPort: 3306

---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
  namespace: dorentme
spec:
  serviceName: mysql
  replicas: 1

  selector:
    matchLabels:
      app: mysql

  template:
    metadata:
      labels:
        app: mysql

    spec:
      terminationGracePeriodSeconds: 30

      containers:
        - name: mysql
          image: mysql:8.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: mysql
              containerPort: 3306

          envFrom:
            - secretRef:
                name: mysql-secret

          resources:
            requests:
              cpu: 250m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 1Gi

          startupProbe:
            exec:
              command:
                - sh
                - -c
                - MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h 127.0.0.1 -uroot --silent
            periodSeconds: 5
            failureThreshold: 30

          readinessProbe:
            exec:
              command:
                - sh
                - -c
                - MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h 127.0.0.1 -uroot --silent
            periodSeconds: 10
            failureThreshold: 3

          livenessProbe:
            exec:
              command:
                - sh
                - -c
                - MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysqladmin ping -h 127.0.0.1 -uroot --silent
            periodSeconds: 20
            failureThreshold: 3

          volumeMounts:
            - name: mysql-data
              mountPath: /var/lib/mysql

  volumeClaimTemplates:
    - metadata:
        name: mysql-data
      spec:
        accessModes:
          - ReadWriteOnce
        storageClassName: local-path
        resources:
          requests:
            storage: 5Gi
```

## `database/schema.sql`

```sql
-- DoRentMe AI Fashion Rental Platform
-- Fresh schema for Microsoft SQL Server / Azure SQL Database.
-- This file creates an empty, normalized database schema.

-- 1. Roles
CREATE TABLE Roles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(255) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT UQ_Roles_Code UNIQUE (Code),
  CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);

-- 2. Users
CREATE TABLE Users (
  Id INT PRIMARY KEY IDENTITY(1,1),
  RoleId INT NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  PasswordHash NVARCHAR(255) NOT NULL,
  LoyaltyPoints INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id),
  CONSTRAINT UQ_Users_Email UNIQUE (Email),
  CONSTRAINT CK_Users_LoyaltyPoints CHECK (LoyaltyPoints >= 0)
);

-- 3. UserAddresses
CREATE TABLE UserAddresses (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  AddressLine NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  Note NVARCHAR(500) NULL,
  IsDefault BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- 4. Shops
CREATE TABLE Shops (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  Email NVARCHAR(150) NULL,
  Address NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL
);

-- 5. Categories
CREATE TABLE Categories (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Categories_Name UNIQUE (Name),
  CONSTRAINT UQ_Categories_Slug UNIQUE (Slug)
);

-- 6. Brands
CREATE TABLE Brands (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Brands_Name UNIQUE (Name),
  CONSTRAINT UQ_Brands_Slug UNIQUE (Slug)
);

-- 7. Products
CREATE TABLE Products (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OwnerUserId INT NOT NULL,
  CategoryId INT NOT NULL,
  BrandId INT NULL,
  Name NVARCHAR(200) NOT NULL,
  Slug NVARCHAR(220) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  Price1Day DECIMAL(18,2) NOT NULL,
  Price3Day DECIMAL(18,2) NOT NULL,
  ExtraDayPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
  PriceTag DECIMAL(18,2) NULL,
  PriceDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  PurchaseCost DECIMAL(18,2) NULL,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Products_OwnerUser FOREIGN KEY (OwnerUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
  CONSTRAINT FK_Products_Brands FOREIGN KEY (BrandId) REFERENCES Brands(Id),
  CONSTRAINT UQ_Products_Slug UNIQUE (Slug),
  CONSTRAINT CK_Products_Price1Day CHECK (Price1Day >= 0),
  CONSTRAINT CK_Products_Price3Day CHECK (Price3Day >= 0),
  CONSTRAINT CK_Products_ExtraDayPrice CHECK (ExtraDayPrice >= 0),
  CONSTRAINT CK_Products_PriceTag CHECK (PriceTag IS NULL OR PriceTag >= 0),
  CONSTRAINT CK_Products_PriceDeposit CHECK (PriceDeposit >= 0),
  CONSTRAINT CK_Products_PurchaseCost CHECK (PurchaseCost IS NULL OR PurchaseCost >= 0),
  CONSTRAINT CK_Products_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_Products_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 8. ProductImages
CREATE TABLE ProductImages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  ImageUrl NVARCHAR(500) NOT NULL,
  IsPrimary BIT NOT NULL DEFAULT 0,
  SortOrder INT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_ProductImages_SortOrder CHECK (SortOrder >= 0)
);

-- 9. ProductVariants
CREATE TABLE ProductVariants (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Size NVARCHAR(50) NOT NULL,
  Color NVARCHAR(80) NOT NULL,
  VariantCode NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductVariants_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductVariants_Product_Size_Color UNIQUE (ProductId, Size, Color)
);

-- 10. ProductInventoryItems
CREATE TABLE ProductInventoryItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductVariantId INT NOT NULL,
  AssetCode NVARCHAR(100) NOT NULL,
  Condition NVARCHAR(50) NOT NULL DEFAULT 'GOOD',
  Status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  Notes NVARCHAR(500) NULL,
  AcquiredAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductInventoryItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT UQ_ProductInventoryItems_AssetCode UNIQUE (AssetCode),
  CONSTRAINT CK_ProductInventoryItems_Condition CHECK (
    Condition IN ('NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED')
  ),
  CONSTRAINT CK_ProductInventoryItems_Status CHECK (
    Status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'CLEANING', 'MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED')
  )
);

-- 11. Carts
CREATE TABLE Carts (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'active',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Carts_UserOrSession CHECK (UserId IS NOT NULL OR SessionId IS NOT NULL),
  CONSTRAINT CK_Carts_Status CHECK (Status IN ('active', 'ordered', 'abandoned'))
);

-- 12. CartItems
CREATE TABLE CartItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  CartId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  Quantity INT NOT NULL DEFAULT 1,
  RentalStartDate DATE NOT NULL,
  RentalEndDate DATE NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES Carts(Id),
  CONSTRAINT FK_CartItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_CartItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_CartItems_DateRange CHECK (RentalEndDate > RentalStartDate),
  CONSTRAINT UQ_CartItems_EquivalentLine UNIQUE (CartId, ProductVariantId, RentalStartDate, RentalEndDate)
);

-- 13. Orders
CREATE TABLE Orders (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderCode NVARCHAR(50) NOT NULL,
  UserId INT NULL,
  CustomerName NVARCHAR(100) NOT NULL,
  CustomerPhone NVARCHAR(20) NOT NULL,
  CustomerEmail NVARCHAR(150) NULL,
  ShippingAddress NVARCHAR(500) NOT NULL,
  CustomerNote NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending_confirmation',
  TotalRent DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDiscount DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalAmount AS (TotalRent + TotalDeposit - TotalDiscount) PERSISTED,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  DeliveryConfirmed BIT NOT NULL DEFAULT 0,
  ReturnRequestedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Orders_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_Orders_OrderCode UNIQUE (OrderCode),
  CONSTRAINT CK_Orders_Status CHECK (
    Status IN ('pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned', 'cancelled')
  ),
  CONSTRAINT CK_Orders_TotalRent CHECK (TotalRent >= 0),
  CONSTRAINT CK_Orders_TotalDeposit CHECK (TotalDeposit >= 0),
  CONSTRAINT CK_Orders_TotalDiscount CHECK (TotalDiscount >= 0),
  CONSTRAINT CK_Orders_DateRange CHECK (EndDate > StartDate)
);

-- 14. OrderItems
CREATE TABLE OrderItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  ProductId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  ProductNameSnapshot NVARCHAR(200) NOT NULL,
  SizeSnapshot NVARCHAR(50) NOT NULL,
  ColorSnapshot NVARCHAR(80) NOT NULL,
  Quantity INT NOT NULL,
  PricePerItem DECIMAL(18,2) NOT NULL,
  DepositPerItem DECIMAL(18,2) NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_OrderItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_OrderItems_PricePerItem CHECK (PricePerItem >= 0),
  CONSTRAINT CK_OrderItems_DepositPerItem CHECK (DepositPerItem >= 0)
);

-- 15. RentalReservations
CREATE TABLE RentalReservations (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderItemId INT NOT NULL,
  ProductInventoryItemId INT NOT NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'RESERVED',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_RentalReservations_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT FK_RentalReservations_ProductInventoryItems FOREIGN KEY (ProductInventoryItemId) REFERENCES ProductInventoryItems(Id),
  CONSTRAINT CK_RentalReservations_DateRange CHECK (EndDate > StartDate),
  CONSTRAINT CK_RentalReservations_Status CHECK (
    Status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')
  )
);

-- 16. Payments
CREATE TABLE Payments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  Method NVARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransferContent NVARCHAR(200) NULL,
  TransactionCode NVARCHAR(100) NULL,
  ProviderTransactionId NVARCHAR(150) NULL,
  PaidAt DATETIME2 NULL,
  ConfirmedByUserId INT NULL,
  ConfirmedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Payments_ConfirmedByUser FOREIGN KEY (ConfirmedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
  CONSTRAINT CK_Payments_Status CHECK (
    Status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  )
);

-- 17. Shipments
CREATE TABLE Shipments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderId INT NOT NULL,
  Direction NVARCHAR(20) NOT NULL DEFAULT 'outbound',
  Provider NVARCHAR(50) NOT NULL DEFAULT 'SPX',
  ServiceType NVARCHAR(50) NOT NULL DEFAULT 'instant',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  TrackingCode NVARCHAR(100) NULL,
  ProviderOrderCode NVARCHAR(100) NULL,
  SenderName NVARCHAR(100) NOT NULL,
  SenderPhone NVARCHAR(20) NOT NULL,
  SenderAddress NVARCHAR(500) NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  ReceiverPhone NVARCHAR(20) NOT NULL,
  ReceiverAddress NVARCHAR(500) NOT NULL,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  CodAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  PickupTime DATETIME2 NULL,
  EstimatedDeliveryTime DATETIME2 NULL,
  DeliveredAt DATETIME2 NULL,
  CancelledAt DATETIME2 NULL,
  RawProviderResponse NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Shipments_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Shipments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_Shipments_Direction CHECK (Direction IN ('outbound', 'return')),
  CONSTRAINT CK_Shipments_Status CHECK (
    Status IN ('pending', 'created', 'assigned', 'picked_up', 'shipping', 'delivered', 'failed', 'cancelled', 'returning', 'returned')
  ),
  CONSTRAINT CK_Shipments_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_Shipments_CodAmount CHECK (CodAmount >= 0)
);

-- 18. ShipmentTrackingEvents
CREATE TABLE ShipmentTrackingEvents (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShipmentId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL,
  Message NVARCHAR(500) NULL,
  Location NVARCHAR(255) NULL,
  ProviderEventCode NVARCHAR(100) NULL,
  ProviderEventTime DATETIME2 NULL,
  RawEvent NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ShipmentTrackingEvents_Shipments FOREIGN KEY (ShipmentId) REFERENCES Shipments(Id)
);

-- 19. OrderStatusHistory
CREATE TABLE OrderStatusHistory (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  OldStatus NVARCHAR(50) NULL,
  NewStatus NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedByUserId INT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderStatusHistory_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);

-- 20. Refunds
CREATE TABLE Refunds (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  PaymentId INT NULL,
  Type NVARCHAR(50) NOT NULL DEFAULT 'deposit',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  Reason NVARCHAR(500) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransactionCode NVARCHAR(100) NULL,
  RequestedByUserId INT NULL,
  ProcessedByUserId INT NULL,
  RequestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ProcessedAt DATETIME2 NULL,

  CONSTRAINT FK_Refunds_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES Payments(Id),
  CONSTRAINT FK_Refunds_RequestedByUser FOREIGN KEY (RequestedByUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Refunds_ProcessedByUser FOREIGN KEY (ProcessedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Refunds_Type CHECK (Type IN ('deposit', 'order_cancel', 'compensation', 'other')),
  CONSTRAINT CK_Refunds_Status CHECK (Status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  CONSTRAINT CK_Refunds_Amount CHECK (Amount >= 0)
);

-- 21. ProductLikes
CREATE TABLE ProductLikes (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductLikes_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_ProductLikes_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductLikes_User_Product UNIQUE (UserId, ProductId)
);

-- 22. Reviews
CREATE TABLE Reviews (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  OrderItemId INT NOT NULL,
  Rating INT NOT NULL,
  Comment NVARCHAR(1000) NULL,
  IsApproved BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT UQ_Reviews_User_OrderItem UNIQUE (UserId, OrderItemId),
  CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);

-- 23. ChatSessions
CREATE TABLE ChatSessions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ChatSessions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_ChatSessions_SessionId UNIQUE (SessionId)
);

-- 24. ChatMessages
CREATE TABLE ChatMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ChatSessionId INT NOT NULL,
  Role NVARCHAR(20) NOT NULL,
  Message NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ChatMessages_ChatSessions FOREIGN KEY (ChatSessionId) REFERENCES ChatSessions(Id),
  CONSTRAINT CK_ChatMessages_Role CHECK (Role IN ('user', 'model', 'system'))
);

-- 25. TryOnRequests
CREATE TABLE TryOnRequests (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  ProductId INT NOT NULL,
  RequestId NVARCHAR(100) NULL,
  UserImageUrl NVARCHAR(500) NOT NULL,
  GarmentImageUrl NVARCHAR(500) NOT NULL,
  ResultImageUrl NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  ErrorMessage NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,
  CompletedAt DATETIME2 NULL,

  CONSTRAINT FK_TryOnRequests_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_TryOnRequests_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_TryOnRequests_Status CHECK (Status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 26. LoyaltyTransactions
CREATE TABLE LoyaltyTransactions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  OrderId INT NULL,
  Points INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_LoyaltyTransactions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_LoyaltyTransactions_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_LoyaltyTransactions_Type CHECK (Type IN ('earn', 'redeem', 'adjust'))
);

-- 27. Vouchers
CREATE TABLE Vouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  DiscountType NVARCHAR(20) NOT NULL,
  DiscountValue DECIMAL(18,2) NOT NULL,
  RequiredPoints INT NOT NULL DEFAULT 0,
  MinOrderAmount DECIMAL(18,2) NULL,
  StartAt DATETIME2 NULL,
  EndAt DATETIME2 NULL,
  UsageLimit INT NULL,
  UsedCount INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Vouchers_Code UNIQUE (Code),
  CONSTRAINT CK_Vouchers_DiscountType CHECK (DiscountType IN ('fixed', 'percent')),
  CONSTRAINT CK_Vouchers_DiscountValue CHECK (DiscountValue >= 0),
  CONSTRAINT CK_Vouchers_RequiredPoints CHECK (RequiredPoints >= 0),
  CONSTRAINT CK_Vouchers_MinOrderAmount CHECK (MinOrderAmount IS NULL OR MinOrderAmount >= 0),
  CONSTRAINT CK_Vouchers_UsageLimit CHECK (UsageLimit IS NULL OR UsageLimit > 0),
  CONSTRAINT CK_Vouchers_UsedCount CHECK (UsedCount >= 0),
  CONSTRAINT CK_Vouchers_DateRange CHECK (EndAt IS NULL OR StartAt IS NULL OR EndAt > StartAt)
);

-- 28. UserVouchers
CREATE TABLE UserVouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  VoucherId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'available',
  AcquiredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UsedAt DATETIME2 NULL,
  ExpiresAt DATETIME2 NULL,

  CONSTRAINT FK_UserVouchers_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_UserVouchers_Vouchers FOREIGN KEY (VoucherId) REFERENCES Vouchers(Id),
  CONSTRAINT CK_UserVouchers_Status CHECK (Status IN ('available', 'used', 'expired'))
);

-- 29. ContactMessages
CREATE TABLE ContactMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  Subject NVARCHAR(200) NULL,
  Message NVARCHAR(MAX) NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'new',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT CK_ContactMessages_Status CHECK (Status IN ('new', 'read', 'replied', 'closed'))
);

-- 30. NewsArticles
CREATE TABLE NewsArticles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  AuthorId INT NULL,
  Title NVARCHAR(255) NOT NULL,
  Slug NVARCHAR(255) NOT NULL,
  Description NVARCHAR(500) NULL,
  Content NVARCHAR(MAX) NULL,
  ImageUrl NVARCHAR(500) NULL,
  PublishedAt DATETIME2 NULL,
  IsPublished BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_NewsArticles_Users FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE SET NULL,
  CONSTRAINT UQ_NewsArticles_Slug UNIQUE (Slug)
);

-- 31. ProductMonthlyStats
CREATE TABLE ProductMonthlyStats (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Year INT NOT NULL,
  Month INT NOT NULL,
  TotalOrders INT NOT NULL DEFAULT 0,
  TotalQuantityRented INT NOT NULL DEFAULT 0,
  RentRevenue DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositCollected DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositRefunded DECIMAL(18,2) NOT NULL DEFAULT 0,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  GrossProfit AS (RentRevenue - ShippingFee - DiscountAmount - CleaningCost - MaintenanceCost) PERSISTED,
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductMonthlyStats_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductMonthlyStats_Product_Month UNIQUE (ProductId, Year, Month),
  CONSTRAINT CK_ProductMonthlyStats_Year CHECK (Year >= 2000),
  CONSTRAINT CK_ProductMonthlyStats_Month CHECK (Month BETWEEN 1 AND 12),
  CONSTRAINT CK_ProductMonthlyStats_TotalOrders CHECK (TotalOrders >= 0),
  CONSTRAINT CK_ProductMonthlyStats_TotalQuantityRented CHECK (TotalQuantityRented >= 0),
  CONSTRAINT CK_ProductMonthlyStats_RentRevenue CHECK (RentRevenue >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositCollected CHECK (DepositCollected >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositRefunded CHECK (DepositRefunded >= 0),
  CONSTRAINT CK_ProductMonthlyStats_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DiscountAmount CHECK (DiscountAmount >= 0),
  CONSTRAINT CK_ProductMonthlyStats_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_ProductMonthlyStats_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 32. Notifications
CREATE TABLE Notifications (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Title NVARCHAR(200) NOT NULL,
  Message NVARCHAR(1000) NOT NULL,
  RelatedType NVARCHAR(50) NULL,
  RelatedId INT NULL,
  IsRead BIT NOT NULL DEFAULT 0,
  ReadAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Notifications_Type CHECK (
    Type IN ('order', 'payment', 'shipping', 'refund', 'voucher', 'system', 'tryon')
  )
);

-- Filtered unique indexes.
CREATE UNIQUE INDEX UX_ProductImages_OnePrimaryPerProduct
ON ProductImages(ProductId)
WHERE IsPrimary = 1;

CREATE UNIQUE INDEX UX_Carts_Active_User
ON Carts(UserId)
WHERE UserId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Carts_Active_Session
ON Carts(SessionId)
WHERE SessionId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Payments_ProviderTransactionId
ON Payments(ProviderTransactionId)
WHERE ProviderTransactionId IS NOT NULL;

CREATE UNIQUE INDEX UX_ProductVariants_VariantCode
ON ProductVariants(VariantCode)
WHERE VariantCode IS NOT NULL;

CREATE UNIQUE INDEX UX_TryOnRequests_RequestId
ON TryOnRequests(RequestId)
WHERE RequestId IS NOT NULL;

-- General indexes.
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
CREATE INDEX IX_UserAddresses_UserId ON UserAddresses(UserId);
CREATE INDEX IX_Shops_IsActive ON Shops(IsActive);

CREATE INDEX IX_Products_ShopId ON Products(ShopId);
CREATE INDEX IX_Products_OwnerUserId ON Products(OwnerUserId);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_BrandId ON Products(BrandId);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);

CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(ProductId);
CREATE INDEX IX_ProductInventoryItems_ProductVariantId ON ProductInventoryItems(ProductVariantId);
CREATE INDEX IX_ProductInventoryItems_Status ON ProductInventoryItems(Status);

CREATE INDEX IX_Carts_UserId ON Carts(UserId);
CREATE INDEX IX_Carts_SessionId ON Carts(SessionId);
CREATE INDEX IX_CartItems_CartId ON CartItems(CartId);
CREATE INDEX IX_CartItems_ProductVariantId ON CartItems(ProductVariantId);

CREATE INDEX IX_Orders_ShopId ON Orders(ShopId);
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);

CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(ProductId);
CREATE INDEX IX_OrderItems_ProductVariantId ON OrderItems(ProductVariantId);

CREATE INDEX IX_RentalReservations_Inventory_Date_Status
ON RentalReservations(ProductInventoryItemId, StartDate, EndDate, Status);

CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
CREATE INDEX IX_Payments_Status ON Payments(Status);
CREATE INDEX IX_Payments_TransactionCode ON Payments(TransactionCode);

CREATE INDEX IX_Shipments_ShopId ON Shipments(ShopId);
CREATE INDEX IX_Shipments_OrderId ON Shipments(OrderId);
CREATE INDEX IX_Shipments_Status ON Shipments(Status);
CREATE INDEX IX_Shipments_Direction ON Shipments(Direction);
CREATE INDEX IX_Shipments_TrackingCode ON Shipments(TrackingCode);

CREATE INDEX IX_ShipmentTrackingEvents_ShipmentId_CreatedAt
ON ShipmentTrackingEvents(ShipmentId, CreatedAt);

CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(OrderId);
CREATE INDEX IX_OrderStatusHistory_OrderId_CreatedAt ON OrderStatusHistory(OrderId, CreatedAt);

CREATE INDEX IX_Refunds_OrderId ON Refunds(OrderId);
CREATE INDEX IX_Refunds_PaymentId ON Refunds(PaymentId);
CREATE INDEX IX_Refunds_Status ON Refunds(Status);

CREATE INDEX IX_ProductLikes_UserId ON ProductLikes(UserId);
CREATE INDEX IX_ProductLikes_ProductId ON ProductLikes(ProductId);

CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
CREATE INDEX IX_Reviews_ProductId_CreatedAt ON Reviews(ProductId, CreatedAt);
CREATE INDEX IX_Reviews_OrderItemId ON Reviews(OrderItemId);

CREATE INDEX IX_ChatSessions_UserId ON ChatSessions(UserId);
CREATE INDEX IX_ChatMessages_ChatSessionId_CreatedAt ON ChatMessages(ChatSessionId, CreatedAt);

CREATE INDEX IX_TryOnRequests_UserId_CreatedAt ON TryOnRequests(UserId, CreatedAt);
CREATE INDEX IX_TryOnRequests_ProductId ON TryOnRequests(ProductId);
CREATE INDEX IX_TryOnRequests_Status ON TryOnRequests(Status);

CREATE INDEX IX_LoyaltyTransactions_UserId_CreatedAt ON LoyaltyTransactions(UserId, CreatedAt);
CREATE INDEX IX_UserVouchers_UserId_Status ON UserVouchers(UserId, Status);
CREATE INDEX IX_UserVouchers_VoucherId ON UserVouchers(VoucherId);

CREATE INDEX IX_ContactMessages_Status ON ContactMessages(Status);
CREATE INDEX IX_NewsArticles_AuthorId ON NewsArticles(AuthorId);
CREATE INDEX IX_NewsArticles_IsPublished ON NewsArticles(IsPublished);
CREATE INDEX IX_NewsArticles_PublishedAt ON NewsArticles(PublishedAt);

CREATE INDEX IX_ProductMonthlyStats_ProductId ON ProductMonthlyStats(ProductId);
CREATE INDEX IX_ProductMonthlyStats_YearMonth ON ProductMonthlyStats(Year, Month);

CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
CREATE INDEX IX_Notifications_Type ON Notifications(Type);

-- Seed base roles.
INSERT INTO Roles (Code, Name, Description)
VALUES
('CUSTOMER', 'Customer', 'Customer who rents fashion products'),
('LENDER', 'Lender', 'User who owns and lists rental products'),
('ADMIN', 'Admin', 'Platform administrator');

-- Notes:
-- 1. Products.OwnerUserId must point to a user with the LENDER role. SQL Server cannot enforce this
--    role rule with a normal FK, so enforce it in application/service logic.
-- 2. RentalReservations prevents double booking through transactional application logic:
--    inside a transaction, find a candidate ProductInventoryItem, check for overlapping
--    active reservations where Status IN ('RESERVED', 'ACTIVE'), create the reservation, then commit.
--    The IX_RentalReservations_Inventory_Date_Status index supports that check, but a simple UNIQUE
--    constraint cannot fully prevent date-range overlap.
-- 3. ProductInventoryItems is the source of truth for stock counts. Do not maintain writable
--    TotalQuantity/AvailableQuantity columns on Products.
-- 4. ProductLikes and Reviews are the source of truth for likes/rating. Any displayed counts should
--    be calculated or maintained as documented caches outside this schema.
-- 5. OrderItems store snapshots so historical orders are stable even if products, variants, or prices change.
```

## `database/seed-legacy-catalog.mysql.sql`

```sql
-- Generated by tools/catalog/generate-legacy-catalog-seed.js
-- Idempotent MySQL seed for the legacy DoRentMe catalog.
-- Review @dorentme_seed_* variables before running against production.

START TRANSACTION;

SET @dorentme_seed_owner_email = 'catalog-seed@dorentme.local';
SET @dorentme_seed_shop_name = 'DoRentMe Catalog Seed Shop';
SET @dorentme_seed_shop_id = (SELECT Id FROM Shops WHERE IsActive = 1 ORDER BY Id LIMIT 1);

INSERT INTO Roles (Code, Name, Description, CreatedAt)
SELECT 'LENDER', 'Lender', 'Lender role', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Code = 'LENDER');

SET @dorentme_lender_role_id = (SELECT Id FROM Roles WHERE Code = 'LENDER' LIMIT 1);

INSERT INTO Users (RoleId, Name, Email, Phone, PasswordHash, LoyaltyPoints, IsActive, CreatedAt)
SELECT @dorentme_lender_role_id, 'Catalog Seed Owner', @dorentme_seed_owner_email, NULL, 'SEEDED_DISABLED_LOGIN', 0, 0, UTC_TIMESTAMP()
WHERE @dorentme_seed_shop_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM Users WHERE Email = @dorentme_seed_owner_email);

SET @dorentme_seed_owner_id = (SELECT Id FROM Users WHERE Email = @dorentme_seed_owner_email LIMIT 1);

INSERT INTO Shops (Name, OwnerUserId, Phone, Email, Address, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_name, @dorentme_seed_owner_id, '0000000000', @dorentme_seed_owner_email, 'Seeded catalog shop', 1, UTC_TIMESTAMP()
WHERE @dorentme_seed_shop_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM Shops WHERE Name = @dorentme_seed_shop_name);

SET @dorentme_seed_shop_id = COALESCE(@dorentme_seed_shop_id, (SELECT Id FROM Shops WHERE Name = @dorentme_seed_shop_name LIMIT 1));

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'ﾃ｛ dﾃi', 'ao-dai', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ao-dai');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Ph盻･ ki盻㌻', 'phu-kien', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'phu-kien');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y ﾄ訴 bi盻ハ', 'vay-di-bien', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-di-bien');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y d盻ｱ ti盻㌘', 'vay-du-tiec', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-du-tiec');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y l盻･a', 'vay-lua', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-lua');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'AMELIEE', 'ameliee', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'ameliee');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'CHIRON', 'chiron', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'chiron');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'CHOUCHOU', 'chouchou', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'chouchou');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'D.CHIC', 'd-chic', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'd-chic');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'FLANE', 'flane', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'flane');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'HﾆｯﾆNG BOUTIQUE', 'huong-boutique', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'huong-boutique');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'JOLIE LOFT', 'jolie-loft', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'jolie-loft');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Khﾃ｡c', 'khac', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'khac');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Mainichi', 'mainichi', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'mainichi');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'MAISON LONG', 'maison-long', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'maison-long');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Mys.P', 'mys-p', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'mys-p');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Sﾃ・VINTAGE', 'so-vintage', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'so-vintage');

-- FLANE 窶・UY盻・ KHANH
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・UY盻・ KHANH', 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn', 'ﾃ｛ dﾃi', 260000, 300000, 350000, 1900000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-001');

-- LINN DESIGN 窶・TU盻・HI盻N
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'LINN DESIGN 窶・TU盻・HI盻N', 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53', 'ﾃ｛ dﾃi', 295000, 340000, 350000, 1590000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-001');

-- MAINICHI 窶・M盻呂 MIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mainichi' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAINICHI 窶・M盻呂 MIﾃ劾', 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf', 'ﾃ｛ dﾃi', 220000, 260000, 350000, 1200000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/mainichi-moc-mien-01806b1b979a.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/mainichi-moc-mien-01806b1b979a.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-001');

-- MAINICHI 窶・Yﾃ劾 CHI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mainichi' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAINICHI 窶・Yﾃ劾 CHI', 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n', 'ﾃ｛ dﾃi', 250000, 290000, 350000, 1550000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-001');

-- MAISON LONG 窶・NI盻M N盻蜂
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'maison-long' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAISON LONG 窶・NI盻M N盻蜂', 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex', 'ﾃ｛ dﾃi', 180000, 220000, 350000, 1150000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/maison-long-niem-no-800686bb8652.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/maison-long-niem-no-800686bb8652.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-001');

-- D.CHIC NﾃNG THﾆ PH盻・H盻露
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC NﾃNG THﾆ PH盻・H盻露', 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu', 'ﾃ｛ dﾃi', 280000, 320000, 350000, 1950000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-001');

-- D.CHIC COUTURE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC COUTURE', 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c', 'ﾃ｛ dﾃi', 450000, 500000, 350000, 3500000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-couture-11a66bffc46b.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-couture-11a66bffc46b.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-001');

-- D.CHIC XUﾃ・ VIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC XUﾃ・ VIﾃ劾', 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m', 'ﾃ｛ dﾃi', 440000, 480000, 350000, 2850000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-001');

-- D.CHIC ﾃ・NHIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC ﾃ・NHIﾃ劾', 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd', 'ﾃ｛ dﾃi', 450000, 490000, 350000, 2950000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-001');

-- D.CHIC THIﾃ劾 ﾃ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC THIﾃ劾 ﾃ・, 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2', 'ﾃ｛ dﾃi', 410000, 450000, 350000, 2600000, 1900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-001');

-- TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER', 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu', 'Vﾃ｡y ﾄ訴 bi盻ハ', 160000, 190000, 330000, 930000, 650000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-FREESI', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-001');

-- CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI', 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 'Vﾃ｡y ﾄ訴 bi盻ハ', 225000, 255000, 330000, 1110000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u');

-- AMELIE 窶・VANESSA DRESS XANH NH蘯T
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・VANESSA DRESS XANH NH蘯T', 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 'Vﾃ｡y ﾄ訴 bi盻ハ', 250000, 290000, 340000, 1530000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi');

-- JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６', 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa', 'Vﾃ｡y ﾄ訴 bi盻ハ', 230000, 270000, 330000, 2150000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n');

-- FLANE 窶・REN C盻・Y蘯ｾM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・REN C盻・Y蘯ｾM', 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4', 'Vﾃ｡y ﾄ訴 bi盻ハ', 200000, 240000, 330000, 1080000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-001');

-- JOLIE LOFT 窶・L盻､A
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・L盻､A', 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5', 'Vﾃ｡y ﾄ訴 bi盻ハ', 165000, 195000, 330000, 1320000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-001');

-- JOLIE LOFT 窶・Vﾃ〆 REN Cﾃ・TAY
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 REN Cﾃ・TAY', 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf', 'Vﾃ｡y ﾄ訴 bi盻ハ', 190000, 220000, 330000, 1812000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-FREESIZE-A', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-001');

-- FLANE 窶・REN B盻・Mﾃ僮 TR蘯ｺ VAI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・REN B盻・Mﾃ僮 TR蘯ｺ VAI', 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0', 'Vﾃ｡y ﾄ訴 bi盻ハ', 165000, 195000, 340000, 1006500, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-FREESIZE-AS', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-001');

-- AMELIE 窶・Vﾃ〆 Bﾃ・BABYDOLL C盻・Y蘯ｾM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・Vﾃ〆 Bﾃ・BABYDOLL C盻・Y蘯ｾM', 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg', 'Vﾃ｡y ﾄ訴 bi盻ハ', 140000, 170000, 340000, 870000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-FR', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-00', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-00');

-- Vﾃ〆 REN PH盻蝕 Tﾆ
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Vﾃ〆 REN PH盻蝕 Tﾆ', 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e', 'Vﾃ｡y ﾄ訴 bi盻ハ', 100000, 130000, 330000, 680000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-001');

-- AMELIEE 窶・GARMENT
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIEE 窶・GARMENT', 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq', 'Vﾃ｡y ﾄ訴 bi盻ハ', 140000, 175000, 340000, 888000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-001');

-- AMELIEE 窶・DIVA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIEE 窶・DIVA', 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf', 'Vﾃ｡y ﾄ訴 bi盻ハ', 150000, 190000, 340000, 960000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/ameliee-diva-ac220ddca95e.webp', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/ameliee-diva-ac220ddca95e.webp');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-001');

-- MAISON LONG 窶・TH盻ｦY M盻・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'maison-long' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAISON LONG 窶・TH盻ｦY M盻・, 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7', 'Vﾃ｡y ﾄ訴 bi盻ハ', 190000, 230000, 350000, 1250000, 750000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-001');

-- Vﾃ〆 HOA Mﾃ僊 Hﾃ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Vﾃ〆 HOA Mﾃ僊 Hﾃ・, 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42', 'Vﾃ｡y ﾄ訴 bi盻ハ', 90000, 120000, 330000, 594000, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-001');

-- SET Vﾃ〆 2 Dﾃ・ + CHﾃ・ Vﾃ〆 TR蘯ｮNG KEM LANNIE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'SET Vﾃ〆 2 Dﾃ・ + CHﾃ・ Vﾃ〆 TR蘯ｮNG KEM LANNIE', 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x', 'Vﾃ｡y ﾄ訴 bi盻ハ', 100000, 120000, 330000, 650000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-');

-- Sﾃ・VINTAGE 窶・NATHALIA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・NATHALIA', 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5', 'Vﾃ｡y d盻ｱ ti盻㌘', 490000, 560000, 350000, 3620000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-001');

-- TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER', 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm', 'Vﾃ｡y d盻ｱ ti盻㌘', 160000, 190000, 330000, 930000, 650000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-FREE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-001');

-- JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS', 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z', 'Vﾃ｡y d盻ｱ ti盻㌘', 175000, 200000, 330000, 1600000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i');

-- CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI', 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet', 'Vﾃ｡y d盻ｱ ti盻㌘', 225000, 255000, 330000, 1110000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-F', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-0', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-0');

-- AMELIE 窶・VANESSA DRESS XANH NH蘯T
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・VANESSA DRESS XANH NH蘯T', 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu', 'Vﾃ｡y d盻ｱ ti盻㌘', 250000, 290000, 340000, 1530000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-');

-- JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６', 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi', 'Vﾃ｡y d盻ｱ ti盻㌘', 230000, 270000, 330000, 2150000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n');

-- Sﾃ・VINTAGE 窶・LYRA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・LYRA', 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px', 'Vﾃ｡y d盻ｱ ti盻㌘', 388000, 420000, 350000, 2388000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-001');

-- WONDER HOUSE 窶・LUA DRESS KEM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'WONDER HOUSE 窶・LUA DRESS KEM', 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py', 'Vﾃ｡y d盻ｱ ti盻㌘', 165000, 190000, 330000, 795000, 500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-FREESIZE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-001');

-- Sﾃ・VINTAGE 窶・VELIA (ﾄ職N)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIA (ﾄ職N)', 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2', 'Vﾃ｡y d盻ｱ ti盻㌘', 390000, 440000, 350000, 2590000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-001');

-- Sﾃ・VINTAGE 窶・VELIANA (ﾄ職N)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIANA (ﾄ職N)', 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5', 'Vﾃ｡y d盻ｱ ti盻㌘', 290000, 340000, 350000, 1969000, 1300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-001');

-- CHOUCHOU 窶・ﾄ雪ｺｦM DﾃI REN CHOﾃNG
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM DﾃI REN CHOﾃNG', 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw', 'Vﾃ｡y d盻ｱ ti盻㌘', 200000, 230000, 330000, 990000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-FREESIZ', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-001');

-- Sﾃ・VINTAGE 窶・VELIA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIA', 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6', 'Vﾃ｡y d盻ｱ ti盻㌘', 390000, 440000, 350000, 2590000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-001');

-- Sﾃ・VINTAGE 窶・LAFINE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・LAFINE', 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4', 'Vﾃ｡y d盻ｱ ti盻㌘', 400000, 450000, 350000, 2629000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-001');

-- Sﾃ・VINTAGE 窶・VELIANA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIANA', 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7', 'Vﾃ｡y d盻ｱ ti盻㌘', 290000, 340000, 350000, 1969000, 1300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-001');

-- JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS', 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c', 'Vﾃ｡y d盻ｱ ti盻㌘', 210000, 240000, 330000, 1890000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-');

-- HﾆｯﾆNG BOUTIQUE 窶・LOUISE LACE DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'huong-boutique' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'HﾆｯﾆNG BOUTIQUE 窶・LOUISE LACE DRESS', 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut', 'Vﾃ｡y d盻ｱ ti盻㌘', 380000, 420000, 350000, 2050000, 1400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b');

-- Tﾃ唔 NHUNG ﾄ職N D.CHIC
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 NHUNG ﾄ職N D.CHIC', 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8', 'Ph盻･ ki盻㌻', 60000, 80000, 320000, 980000, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-001');

-- Tﾃ唔 DA ﾄ職N MYS.P
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mys-p' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 DA ﾄ職N MYS.P', 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz', 'Ph盻･ ki盻㌻', 70000, 90000, 320000, 590000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-001');

-- Tﾃ唔 DA ﾄ雪ｻ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 DA ﾄ雪ｻ・, 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3', 'Ph盻･ ki盻㌻', 50000, 70000, 310000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-da-do-ac94ff1d6b71.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-da-do-ac94ff1d6b71.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-001');

-- Tﾃ唔 TR盻ｨNG NG盻靴 TRAI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 TR盻ｨNG NG盻靴 TRAI', 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d', 'Ph盻･ ki盻㌻', 100000, 120000, 330000, NULL, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-001');

-- COMBO PH盻､ KI盻・ ﾃ＾ DﾃI (Vﾃ誰G + B盻廴 + Tﾃ唔)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chiron' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'COMBO PH盻､ KI盻・ ﾃ＾ DﾃI (Vﾃ誰G + B盻廴 + Tﾃ唔)', 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-FREESIZE-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-001');

-- COMBO NG盻靴 TRAI (Tﾃ唔 + Vﾃ誰G C盻・ Tﾃ唔 + B盻廴/Vﾃ誰G TAY)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chiron' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'COMBO NG盻靴 TRAI (Tﾃ唔 + Vﾃ誰G C盻・ Tﾃ唔 + B盻廴/Vﾃ誰G TAY)', 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-FREESI', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-001');

-- Tﾃ唔 Mﾅｨ ﾄ蝕 BI盻・
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 Mﾅｨ ﾄ蝕 BI盻・', 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, 500000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-001');

-- JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS', 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt', 'Vﾃ｡y l盻･a', 175000, 200000, 330000, 1600000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-FR', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-00', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-00');

-- WONDER HOUSE 窶・LUA DRESS KEM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'WONDER HOUSE 窶・LUA DRESS KEM', 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc', 'Vﾃ｡y l盻･a', 165000, 190000, 330000, 795000, 500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-FREESIZE-ASSORTE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-001');

-- JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS', 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3', 'Vﾃ｡y l盻･a', 210000, 240000, 330000, 1890000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-FREESIZE-ASSORT', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-001');

-- JOLIE LOFT 窶・L盻､A
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・L盻､A', 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj', 'Vﾃ｡y l盻･a', 165000, 195000, 330000, 1320000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-001');

COMMIT;

-- Seeded products: 52
-- Seeded categories: 5
-- Seeded brands: 12
```

## `tools/r2/README.md`

```md
# Cloudflare R2 Asset Migration

Phase 2B uploads repository-owned static image assets to Cloudflare R2 while keeping the legacy local images in place for coexistence and rollback.

## Environment

Create the ignored root `.env.r2.local` from `.env.r2.example`:

```env
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=dorentme-assets
R2_PUBLIC_BASE_URL=
```

Only `R2_PUBLIC_BASE_URL` is public browser configuration. Do not put R2 credentials in Vite `VITE_*` variables.

## Commands

```bash
node tools/r2/scan-assets.js
node tools/r2/upload-assets.js
node tools/r2/verify-assets.js
```

`upload-assets.js --dry-run` regenerates manifests and reports the canonical object count without writing objects.

## Deduplication

The scanner deduplicates exact SHA-256 matches only. Canonical selection is deterministic:

1. prefer referenced sources under `image/...`;
2. prefer non-root category paths;
3. choose the lexicographically stable path.

Near-duplicates remain separate assets. Local image files are intentionally retained and legacy HTML references are not mass-rewritten in this phase.

## Outputs

- `tools/r2/asset-migration-manifest.json` is the authoritative tooling manifest with source paths, hashes, MIME, canonical source, R2 keys, public URLs, duplicate mapping, and verification fields.
- `frontend/src/assets/asset-map.json` is the lightweight browser runtime map from legacy source path to canonical R2 key.

R2 keys use semantic folders plus a content hash suffix, for example `products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg`. MIME and key extensions are derived from file bytes where practical.
```

## `tools/r2/r2-assets.js`

```js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

const repoRoot = path.resolve(__dirname, '..', '..');
const manifestPath = path.join(__dirname, 'asset-migration-manifest.json');
const runtimeMapPath = path.join(repoRoot, 'frontend', 'src', 'assets', 'asset-map.json');
const requiredEnv = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'R2_PUBLIC_BASE_URL',
];

const imageExtensions = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const cacheControl = 'public, max-age=31536000, immutable';

function toPosix(relativePath) {
  return relativePath.split(path.sep).join('/');
}

function readEnvFile(filePath = path.join(repoRoot, '.env.r2.local')) {
  const env = {};
  if (fs.existsSync(filePath)) {
    const text = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) continue;
      let value = match[2].trim();
      const commentAt = value.search(/\s#/);
      if (commentAt >= 0) value = value.slice(0, commentAt).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      env[match[1]] = value;
    }
  }
  for (const key of requiredEnv) {
    if (!env[key] && process.env[key]) env[key] = process.env[key];
  }
  return env;
}

function assertEnv(env) {
  const missing = requiredEnv.filter((key) => !env[key]);
  if (missing.length) {
    throw new Error(`Missing required R2 env: ${missing.join(', ')}`);
  }
  if (env.R2_BUCKET !== 'dorentme-assets') {
    throw new Error('R2_BUCKET must be dorentme-assets for this migration');
  }
}

function detectImageType(buffer) {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', extension: '.jpg' };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', extension: '.png' };
  }
  if (
    buffer.length >= 12 &&
    buffer.slice(0, 4).toString('ascii') === 'RIFF' &&
    buffer.slice(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mime: 'image/webp', extension: '.webp' };
  }
  return { mime: 'application/octet-stream', extension: path.extname('unknown') };
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, files);
    } else {
      files.push(absolute);
    }
  }
  return files;
}

function discoverImageFiles() {
  const candidates = [
    ...walk(path.join(repoRoot, 'image')),
    ...fs.readdirSync(repoRoot, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(repoRoot, entry.name)),
  ];

  return candidates
    .filter((filePath) => imageExtensions.has(path.extname(filePath).toLowerCase()))
    .map((filePath) => toPosix(path.relative(repoRoot, filePath)))
    .sort((a, b) => a.localeCompare(b));
}

function referencedPaths() {
  const textExtensions = new Set(['.html', '.js', '.jsx', '.css', '.json', '.md']);
  const haystack = walk(repoRoot)
    .filter((filePath) => {
      const rel = toPosix(path.relative(repoRoot, filePath));
      if (rel.startsWith('.git/') || rel.startsWith('node_modules/') || rel.startsWith('frontend/node_modules/')) return false;
      if (rel === 'tools/r2/asset-migration-manifest.json' || rel === 'frontend/src/assets/asset-map.json') return false;
      return textExtensions.has(path.extname(filePath).toLowerCase());
    })
    .map((filePath) => fs.readFileSync(filePath, 'utf8'))
    .join('\n');

  const refs = new Map();
  for (const sourcePath of discoverImageFiles()) {
    refs.set(sourcePath, haystack.includes(sourcePath) || haystack.includes(sourcePath.replaceAll('/', '\\')));
  }
  return refs;
}

function categoryFor(sourcePath) {
  if (sourcePath.startsWith('image/ao_dai/')) return { bucket: 'products', segment: 'ao-dai' };
  if (sourcePath.startsWith('image/vay_di_bien/')) return { bucket: 'products', segment: 'vay-di-bien' };
  if (sourcePath.startsWith('image/vay_du_tiec/')) return { bucket: 'products', segment: 'vay-du-tiec' };
  if (sourcePath.startsWith('image/vay_lua/')) return { bucket: 'products', segment: 'vay-lua' };
  if (sourcePath.startsWith('image/phu_kien/')) return { bucket: 'products', segment: 'phu-kien' };
  if (sourcePath.startsWith('image/news/')) return { bucket: 'news', segment: '' };
  if (/^(anh_chan_dung|anh_chan_dung_gai|tran_bao_lam|phan_huyen_tran|nguyen_duc_duong|hoang_anh|hoanganh|con_cho_ngu_dan)\./.test(sourcePath)) {
    return { bucket: 'team', segment: '' };
  }
  if (/^(Logo|image-removebg-preview|step-|.*dress|.*dam|.*vay|.*jolie|.*tipblu|.*chouchou|.*vintage)/i.test(sourcePath)) {
    return { bucket: 'ui', segment: '' };
  }
  return { bucket: 'branding', segment: '' };
}

function slugify(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96) || 'asset';
}

function canonicalSortKey(asset, refs) {
  const referencedRank = refs.get(asset.sourcePath) ? 0 : 1;
  const imageRank = asset.sourcePath.startsWith('image/') ? 0 : 1;
  const depthRank = asset.sourcePath.split('/').length > 2 ? 0 : 1;
  return [referencedRank, imageRank, depthRank, asset.sourcePath];
}

function compareCanonical(a, b, refs) {
  const ak = canonicalSortKey(a, refs);
  const bk = canonicalSortKey(b, refs);
  for (let i = 0; i < ak.length; i += 1) {
    if (ak[i] < bk[i]) return -1;
    if (ak[i] > bk[i]) return 1;
  }
  return 0;
}

function buildR2Key(asset) {
  const category = categoryFor(asset.sourcePath);
  const parsed = path.posix.parse(asset.sourcePath);
  const slug = slugify(parsed.name);
  const suffix = asset.sha256.slice(0, 12);
  const fileName = `${slug}-${suffix}${asset.detectedExtension}`;
  return [category.bucket, category.segment, fileName].filter(Boolean).join('/');
}

function generateManifest(env = readEnvFile()) {
  const refs = referencedPaths();
  const assets = discoverImageFiles().map((sourcePath) => {
    const absolute = path.join(repoRoot, sourcePath);
    const buffer = fs.readFileSync(absolute);
    const detected = detectImageType(buffer);
    return {
      sourcePath,
      sha256: crypto.createHash('sha256').update(buffer).digest('hex'),
      sizeBytes: buffer.length,
      detectedMime: detected.mime,
      detectedExtension: detected.extension,
      originalExtension: path.extname(sourcePath).toLowerCase(),
      references: refs.get(sourcePath) ? ['repository text reference'] : [],
    };
  });

  const byHash = new Map();
  for (const asset of assets) {
    if (!byHash.has(asset.sha256)) byHash.set(asset.sha256, []);
    byHash.get(asset.sha256).push(asset);
  }

  const publicBase = String(env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');
  const manifestAssets = [];
  for (const group of [...byHash.values()].sort((a, b) => a[0].sha256.localeCompare(b[0].sha256))) {
    group.sort((a, b) => compareCanonical(a, b, refs));
    const canonical = group[0];
    const r2Key = buildR2Key(canonical);
    for (const asset of group) {
      const category = categoryFor(asset.sourcePath);
      manifestAssets.push({
        sourcePath: asset.sourcePath,
        sha256: asset.sha256,
        sizeBytes: asset.sizeBytes,
        detectedMime: asset.detectedMime,
        detectedExtension: asset.detectedExtension,
        originalExtension: asset.originalExtension,
        category: [category.bucket, category.segment].filter(Boolean).join('/'),
        canonicalSourcePath: canonical.sourcePath,
        isCanonical: asset.sourcePath === canonical.sourcePath,
        r2Key,
        publicUrl: publicBase ? `${publicBase}/${r2Key}` : r2Key,
        duplicateOfSourcePath: asset.sourcePath === canonical.sourcePath ? null : canonical.sourcePath,
        duplicateOfKey: asset.sourcePath === canonical.sourcePath ? null : r2Key,
        referenceCount: asset.references.length,
        references: asset.references,
        uploaded: false,
        s3Verified: false,
        publicVerified: false,
      });
    }
  }

  manifestAssets.sort((a, b) => a.sourcePath.localeCompare(b.sourcePath));
  const canonicalAssets = manifestAssets.filter((asset) => asset.isCanonical);
  const duplicateGroups = [...byHash.values()].filter((group) => group.length > 1);
  const duplicateFileCount = assets.length - canonicalAssets.length;
  const totalSourceBytes = assets.reduce((sum, asset) => sum + asset.sizeBytes, 0);
  const canonicalUploadedBytes = canonicalAssets.reduce((sum, asset) => sum + asset.sizeBytes, 0);

  return {
    generatedAt: new Date().toISOString(),
    bucket: env.R2_BUCKET || '',
    publicBaseUrl: publicBase,
    cacheControl,
    canonicalSelectionPolicy: [
      'Prefer referenced source under image/...',
      'Prefer non-root category path',
      'Choose lexicographically stable path',
    ],
    summary: {
      sourceFileCount: assets.length,
      exactDuplicateFileCount: duplicateFileCount,
      duplicateGroups: duplicateGroups.length,
      canonicalObjectCount: canonicalAssets.length,
      totalSourceBytes,
      canonicalUploadedBytes,
      bytesSaved: totalSourceBytes - canonicalUploadedBytes,
    },
    assets: manifestAssets,
  };
}

function writeManifest(manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const runtimeMap = {};
  for (const asset of manifest.assets) {
    runtimeMap[asset.sourcePath] = asset.r2Key;
  }
  fs.writeFileSync(runtimeMapPath, `${JSON.stringify(runtimeMap, null, 2)}\n`);
}

function signingKey(secret, date) {
  const kDate = crypto.createHmac('sha256', `AWS4${secret}`).update(date, 'utf8').digest();
  const kRegion = crypto.createHmac('sha256', kDate).update('auto', 'utf8').digest();
  const kService = crypto.createHmac('sha256', kRegion).update('s3', 'utf8').digest();
  return crypto.createHmac('sha256', kService).update('aws4_request', 'utf8').digest();
}

function encodePath(key) {
  return key.split('/').map(encodeURIComponent).join('/');
}

function amzDate(date) {
  return date.toISOString().replace(/[:-]|\.\d{3}/g, '');
}

function dateStamp(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, '');
}

function r2Request(env, method, key, body = Buffer.alloc(0), extraHeaders = {}) {
  return new Promise((resolve) => {
    const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const now = new Date();
    const amz = amzDate(now);
    const date = dateStamp(now);
    const canonicalUri = `/${env.R2_BUCKET}/${encodePath(key)}`;
    const payloadHash = crypto.createHash('sha256').update(body).digest('hex');
    const headers = {
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amz,
      ...extraHeaders,
    };
    if (body.length) {
      headers['content-length'] = body.length;
    }
    const sortedNames = Object.keys(headers).map((name) => name.toLowerCase()).sort();
    const lowerHeaders = {};
    for (const [name, value] of Object.entries(headers)) lowerHeaders[name.toLowerCase()] = String(value).trim();
    const canonicalHeaders = sortedNames.map((name) => `${name}:${lowerHeaders[name]}\n`).join('');
    const signedHeaders = sortedNames.join(';');
    const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n');
    const scope = `${date}/auto/s3/aws4_request`;
    const stringToSign = ['AWS4-HMAC-SHA256', amz, scope, crypto.createHash('sha256').update(canonicalRequest).digest('hex')].join('\n');
    const signature = crypto.createHmac('sha256', signingKey(env.R2_SECRET_ACCESS_KEY, date)).update(stringToSign, 'utf8').digest('hex');
    headers.Authorization = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    const req = https.request({ host, method, path: canonicalUri, headers, timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), error: '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ status: 0, headers: {}, body: Buffer.alloc(0), error: error.code || error.message }));
    if (body.length) req.write(body);
    req.end();
  });
}

function publicGet(url) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: 30000 }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks), error: '' }));
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', (error) => resolve({ status: 0, headers: {}, body: Buffer.alloc(0), error: error.code || error.message }));
  });
}

module.exports = {
  cacheControl,
  repoRoot,
  manifestPath,
  runtimeMapPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
  publicGet,
};
```

## `tools/r2/scan-assets.js`

```js
const { generateManifest, writeManifest, manifestPath, runtimeMapPath } = require('./r2-assets');

const manifest = generateManifest();
writeManifest(manifest);

console.log(`Generated ${manifestPath}`);
console.log(`Generated ${runtimeMapPath}`);
console.log(JSON.stringify(manifest.summary, null, 2));
```

## `tools/r2/upload-assets.js`

```js
const fs = require('fs');
const path = require('path');
const {
  cacheControl,
  repoRoot,
  manifestPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
} = require('./r2-assets');

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const env = readEnvFile();
  assertEnv(env);

  const manifest = generateManifest(env);
  writeManifest(manifest);
  const canonicalAssets = manifest.assets.filter((asset) => asset.isCanonical);
  let uploaded = 0;
  let skipped = 0;

  for (const asset of canonicalAssets) {
    const sourceBuffer = fs.readFileSync(path.join(repoRoot, asset.sourcePath));
    const head = await r2Request(env, 'HEAD', asset.r2Key);
    if (head.status === 200) {
      const remoteLength = Number(head.headers['content-length'] || 0);
      const remoteType = String(head.headers['content-type'] || '').split(';')[0].toLowerCase();
      if (remoteLength === asset.sizeBytes && remoteType === asset.detectedMime) {
        skipped += 1;
        asset.uploaded = true;
        continue;
      }
    }

    if (dryRun) continue;

    const put = await r2Request(env, 'PUT', asset.r2Key, sourceBuffer, {
      'content-type': asset.detectedMime,
      'cache-control': cacheControl,
    });
    if (put.status < 200 || put.status >= 300) {
      throw new Error(`Upload failed for ${asset.sourcePath} (${asset.r2Key}) with HTTP ${put.status || put.error}`);
    }
    uploaded += 1;
    asset.uploaded = true;
  }

  writeManifest(manifest);
  console.log(`Manifest: ${manifestPath}`);
  console.log(`Canonical objects: ${canonicalAssets.length}`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped existing: ${skipped}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
```

## `tools/r2/verify-assets.js`

```js
const fs = require('fs');
const path = require('path');
const {
  repoRoot,
  manifestPath,
  runtimeMapPath,
  readEnvFile,
  assertEnv,
  generateManifest,
  writeManifest,
  r2Request,
  publicGet,
} = require('./r2-assets');

async function main() {
  const env = readEnvFile();
  assertEnv(env);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : generateManifest(env);
  const canonicalAssets = manifest.assets.filter((asset) => asset.isCanonical);
  const seenKeys = new Set();
  const failures = [];

  if (manifest.summary.canonicalObjectCount !== 70) {
    failures.push(`Expected 70 canonical objects, found ${manifest.summary.canonicalObjectCount}`);
  }

  for (const asset of manifest.assets) {
    if (!asset.isCanonical && asset.r2Key !== manifest.assets.find((candidate) => candidate.sourcePath === asset.canonicalSourcePath)?.r2Key) {
      failures.push(`Duplicate mapping mismatch for ${asset.sourcePath}`);
    }
  }

  for (const asset of canonicalAssets) {
    if (seenKeys.has(asset.r2Key)) failures.push(`R2 key collision: ${asset.r2Key}`);
    seenKeys.add(asset.r2Key);

    const sourceBuffer = fs.readFileSync(path.join(repoRoot, asset.sourcePath));
    const s3 = await r2Request(env, 'GET', asset.r2Key);
    if (s3.status !== 200) {
      failures.push(`S3 GET failed for ${asset.r2Key}: HTTP ${s3.status || s3.error}`);
      continue;
    }
    const remoteHash = require('crypto').createHash('sha256').update(s3.body).digest('hex');
    if (remoteHash !== asset.sha256 || !s3.body.equals(sourceBuffer)) failures.push(`S3 hash mismatch for ${asset.r2Key}`);
    const remoteType = String(s3.headers['content-type'] || '').split(';')[0].toLowerCase();
    if (remoteType !== asset.detectedMime) failures.push(`Content-Type mismatch for ${asset.r2Key}: ${remoteType}`);
    asset.s3Verified = true;

    const publicResponse = await publicGet(asset.publicUrl);
    if (publicResponse.status !== 200) {
      failures.push(`Public GET failed for ${asset.r2Key}: HTTP ${publicResponse.status || publicResponse.error}`);
      continue;
    }
    if (!publicResponse.body.equals(sourceBuffer)) failures.push(`Public content mismatch for ${asset.r2Key}`);
    asset.publicVerified = true;
  }

  writeManifest(manifest);

  if (!fs.existsSync(runtimeMapPath)) failures.push(`Missing runtime asset map: ${runtimeMapPath}`);
  const runtimeMap = JSON.parse(fs.readFileSync(runtimeMapPath, 'utf8'));
  for (const asset of manifest.assets) {
    if (runtimeMap[asset.sourcePath] !== asset.r2Key) failures.push(`Runtime map mismatch for ${asset.sourcePath}`);
  }

  console.log(`Canonical objects verified: ${canonicalAssets.length}`);
  console.log(`Duplicate source paths verified: ${manifest.summary.exactDuplicateFileCount}`);
  console.log(`Public URLs verified: ${canonicalAssets.length}`);

  if (failures.length) {
    console.error(failures.join('\n'));
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
```

## `tools/r2/asset-migration-manifest.json`

```json
{
  "generatedAt": "2026-08-27T18:02:57.662Z",
  "bucket": "dorentme-assets",
  "publicBaseUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev",
  "cacheControl": "public, max-age=31536000, immutable",
  "canonicalSelectionPolicy": [
    "Prefer referenced source under image/...",
    "Prefer non-root category path",
    "Choose lexicographically stable path"
  ],
  "summary": {
    "sourceFileCount": 86,
    "exactDuplicateFileCount": 16,
    "duplicateGroups": 11,
    "canonicalObjectCount": 70,
    "totalSourceBytes": 13572271,
    "canonicalUploadedBytes": 10979738,
    "bytesSaved": 2592533
  },
  "assets": [
    {
      "sourcePath": "amelie-vanessa-dress-xanh-nhat.jpg",
      "sha256": "f3db7d3e4f8adb628e1f6fd7a5f7df6a1b2af13a055dfed6f0d1be3dde38c51b",
      "sizeBytes": 332184,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "duplicateOfKey": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "anh_chan_dung_gai.jpg",
      "sha256": "663916e23921e218efc060190c32b32ee76c68583a75ad0376b0cc83dc9a5557",
      "sizeBytes": 8028,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "anh_chan_dung_gai.jpg",
      "isCanonical": true,
      "r2Key": "team/anh-chan-dung-gai-663916e23921.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/anh-chan-dung-gai-663916e23921.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "anh_chan_dung.jpg",
      "sha256": "8242e5e0e80731e615518159619d798e88795cac0d7190174bf00db83b43ef57",
      "sizeBytes": 4280,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "anh_chan_dung.jpg",
      "isCanonical": true,
      "r2Key": "team/anh-chan-dung-8242e5e0e807.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/anh-chan-dung-8242e5e0e807.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "chouchou-dam-ren-nude-dang-dai.jpg",
      "sha256": "bb93b72ae214d11ad0521ae37cf8cd40ff57a6e0651969edefb4b1d1e69b46b8",
      "sizeBytes": 114737,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "duplicateOfKey": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "con_cho_ngu_dan.jpg",
      "sha256": "6370468044afb561530f016256eef7ab8eba3568a30f8e69c0aa055e2cd50925",
      "sizeBytes": 5271,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "con_cho_ngu_dan.jpg",
      "isCanonical": true,
      "r2Key": "team/con-cho-ngu-dan-6370468044af.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/con-cho-ngu-dan-6370468044af.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "hoang_anh.jpg",
      "sha256": "b4c8145623857ab5734fcaf5a117241795a6fa546d90113d8a06bab6a11154d5",
      "sizeBytes": 240670,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "hoang_anh.jpg",
      "isCanonical": true,
      "r2Key": "team/hoang-anh-b4c814562385.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/hoang-anh-b4c814562385.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "hoanganh.jpg",
      "sha256": "b4c8145623857ab5734fcaf5a117241795a6fa546d90113d8a06bab6a11154d5",
      "sizeBytes": 240670,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "hoang_anh.jpg",
      "isCanonical": false,
      "r2Key": "team/hoang-anh-b4c814562385.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/hoang-anh-b4c814562385.jpg",
      "duplicateOfSourcePath": "hoang_anh.jpg",
      "duplicateOfKey": "team/hoang-anh-b4c814562385.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image-removebg-preview.png",
      "sha256": "25ff5ff1cb63d207f494550ec623755b34501bb36aa8359b78b92dc0a911f685",
      "sizeBytes": 71296,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "ui",
      "canonicalSourcePath": "image-removebg-preview.png",
      "isCanonical": true,
      "r2Key": "ui/image-removebg-preview-25ff5ff1cb63.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/ui/image-removebg-preview-25ff5ff1cb63.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/d_chic_thien_y.jpg",
      "sha256": "211c0ae58a7c096571786464671c903eae9f07a1024fd0bd2eed343fcc87a3f9",
      "sizeBytes": 576704,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/d_chic_thien_y.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/d.chic_xuan_vien.jpg",
      "sha256": "639f979153cfa97cb15bba7dc230f6f12b2b9ba87d01b521ce25a64fc04463ff",
      "sizeBytes": 102890,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/d.chic_xuan_vien.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/dchic_couture.jpg",
      "sha256": "11a66bffc46b1ebf350c24f348740f15349807ace0437cac9790dbdecce9d3bc",
      "sizeBytes": 162102,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/dchic_couture.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/dchic-couture-11a66bffc46b.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/dchic-couture-11a66bffc46b.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/dchic_y_nhien.jpg",
      "sha256": "4bd76df1ba2089d1f8c950ac1902929559fc47a31fe12aef5fd82837f35ce3ba",
      "sizeBytes": 458401,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/dchic_y_nhien.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/dchic-nang-tho-pho-hoi.jpg",
      "sha256": "210371af890836a5796ec294c04c9ceb36254f002495be6ac397fd199e72b3d0",
      "sizeBytes": 222668,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/dchic-nang-tho-pho-hoi.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/flane_uyenkhanh.jpg",
      "sha256": "a78b7f41388fb57347b8c12095cb6572173adefc11a4a5f3443d6de1c2024617",
      "sizeBytes": 244784,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/flane_uyenkhanh.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/linn_design_tue_hien.jpg",
      "sha256": "d3ac5a259dfc338dc3b9c6725e902318fcb7193a50308c6a5fe75a039f756574",
      "sizeBytes": 130830,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/linn_design_tue_hien.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/mainichi_moc_mien.png",
      "sha256": "01806b1b979a60ca41ce24309cb9576712de7d191f0304721b690212d462b098",
      "sizeBytes": 267394,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/mainichi_moc_mien.png",
      "isCanonical": true,
      "r2Key": "products/ao-dai/mainichi-moc-mien-01806b1b979a.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/mainichi-moc-mien-01806b1b979a.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/mainichi_yen_chi.jpg",
      "sha256": "f9570e47ee6b583e3cde9d15bf87d51a5fe7fccf5ac040b388ceb7490579e9a3",
      "sizeBytes": 94626,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/mainichi_yen_chi.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/ao_dai/maison_long_niem_no.jpg",
      "sha256": "800686bb8652982d53ffbcb39b656875bade127e3a81de19b9563ab717abf06d",
      "sizeBytes": 368938,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/ao-dai",
      "canonicalSourcePath": "image/ao_dai/maison_long_niem_no.jpg",
      "isCanonical": true,
      "r2Key": "products/ao-dai/maison-long-niem-no-800686bb8652.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/ao-dai/maison-long-niem-no-800686bb8652.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-3_93465ac020774322b3a5308501a68c69_grande.jpg",
      "sha256": "762feda59c9c13a37a13c3abd1b1bc7c46ffffc355ba9bf9fa94caa28188e598",
      "sizeBytes": 59114,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".jpg",
      "category": "news",
      "canonicalSourcePath": "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-3_93465ac020774322b3a5308501a68c69_grande.jpg",
      "isCanonical": true,
      "r2Key": "news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-3-93465ac020774322b3a5308501a68c69-grande-762feda59c9c.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-3-93465ac020774322b3a5308501a68c69-grande-762feda59c9c.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-4_6c96da420d5c4267aa6fbe89a1658cd9_1024x1024.jpg",
      "sha256": "4d716bbd2f751f4366b079a23ab995a73f75c4a2ff3a163c57519e722f4fd8a4",
      "sizeBytes": 156244,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".jpg",
      "category": "news",
      "canonicalSourcePath": "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-4_6c96da420d5c4267aa6fbe89a1658cd9_1024x1024.jpg",
      "isCanonical": true,
      "r2Key": "news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-4-6c96da420d5c4267aa6fbe89a1658cd9-1024x1-4d716bbd2f75.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-4-6c96da420d5c4267aa6fbe89a1658cd9-1024x1-4d716bbd2f75.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/news/thue_ao_dai_tet_2026_tai_ho_chi_minh_gia_re_mau_dep_hot_trend.jpg",
      "sha256": "251f2801fcb49c912489cf002aa3b5921a29f923d97190f098ed951aa21cfcc3",
      "sizeBytes": 69906,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "news",
      "canonicalSourcePath": "image/news/thue_ao_dai_tet_2026_tai_ho_chi_minh_gia_re_mau_dep_hot_trend.jpg",
      "isCanonical": true,
      "r2Key": "news/thue-ao-dai-tet-2026-tai-ho-chi-minh-gia-re-mau-dep-hot-trend-251f2801fcb4.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/news/thue-ao-dai-tet-2026-tai-ho-chi-minh-gia-re-mau-dep-hot-trend-251f2801fcb4.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/news/thue_trang_phuc_bieu_dien_re_dep_hcm_sand_outfit.jpg",
      "sha256": "cedc9f1b9405b8b419ff74f79617af359f2e430c33a1046a30ee71ad466aa30c",
      "sizeBytes": 13916,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".jpg",
      "category": "news",
      "canonicalSourcePath": "image/news/thue_trang_phuc_bieu_dien_re_dep_hcm_sand_outfit.jpg",
      "isCanonical": true,
      "r2Key": "news/thue-trang-phuc-bieu-dien-re-dep-hcm-sand-outfit-cedc9f1b9405.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/news/thue-trang-phuc-bieu-dien-re-dep-hcm-sand-outfit-cedc9f1b9405.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/news/tuyen_tap_outfit_giang_sinh_do_hoa_trang_sand_cho_thue_trang_phuc_re_dep_tai_hcm.jpg",
      "sha256": "b4247e92c952f2188af6e551c0419609db8388f9d9d604a8baf95f4615a229ce",
      "sizeBytes": 24216,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".jpg",
      "category": "news",
      "canonicalSourcePath": "image/news/tuyen_tap_outfit_giang_sinh_do_hoa_trang_sand_cho_thue_trang_phuc_re_dep_tai_hcm.jpg",
      "isCanonical": true,
      "r2Key": "news/tuyen-tap-outfit-giang-sinh-do-hoa-trang-sand-cho-thue-trang-phuc-re-dep-tai-hcm-b4247e92c952.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/news/tuyen-tap-outfit-giang-sinh-do-hoa-trang-sand-cho-thue-trang-phuc-re-dep-tai-hcm-b4247e92c952.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/com_bo_phu_kien_ao_dai.jpg",
      "sha256": "14d0ec771a02974cadd243b8c6bf844d55d92464096ebc5228c42012bc288726",
      "sizeBytes": 28238,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/com_bo_phu_kien_ao_dai.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/combo_ngoc_trai.jpg",
      "sha256": "852e46f9db0f0621a9adda5f4429e04d39ca1b46317eaef9fefbc76a1552ca03",
      "sizeBytes": 35876,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/combo_ngoc_trai.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/tui_da_den_mysp.jpg",
      "sha256": "5db7212e733792b0a522f8823e4270007be7130a82c5cdc16f9712415a36d31c",
      "sizeBytes": 298422,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/tui_da_den_mysp.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/tui_da_do.jpg",
      "sha256": "ac94ff1d6b71b51c42fc99ad3c0adb738c7af07ce953fb7eaa4f865982ba0f37",
      "sizeBytes": 218799,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/tui_da_do.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/tui-da-do-ac94ff1d6b71.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/tui-da-do-ac94ff1d6b71.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/tui_mu_di_bien.jpg",
      "sha256": "41a286f65c0dffa7942361529a60cbcf212c04be1c2210e3f7f933b847a01b48",
      "sizeBytes": 137445,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/tui_mu_di_bien.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/tui_nhung_den_dchic.jpg",
      "sha256": "9d2e3d1a6c986d2a7e16b654156214a61f46243eb639f335b10326c79c834ab7",
      "sizeBytes": 571717,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/tui_nhung_den_dchic.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/phu_kien/tui_trung_ngoc_trai.jpg",
      "sha256": "56969992dfbf6f8d4b30de693d5cd01d49303b30a7bb25ad6af63a758a5d754d",
      "sizeBytes": 164279,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/phu-kien",
      "canonicalSourcePath": "image/phu_kien/tui_trung_ngoc_trai.jpg",
      "isCanonical": true,
      "r2Key": "products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "sha256": "f3db7d3e4f8adb628e1f6fd7a5f7df6a1b2af13a055dfed6f0d1be3dde38c51b",
      "sizeBytes": 332184,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/amelie_vay_bi_babydoll_co_yem.jpg",
      "sha256": "52e248e5a8ed01a319558749707944c8967c6a6ba7f34235271eac913078d33e",
      "sizeBytes": 152424,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/amelie_vay_bi_babydoll_co_yem.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/ameliee_diva.webp",
      "sha256": "ac220ddca95e479f33219b5bfcc9d9e9a0aa961fe838cf203d6c43a134fe838e",
      "sizeBytes": 119426,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".webp",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/ameliee_diva.webp",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/ameliee-diva-ac220ddca95e.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/ameliee-diva-ac220ddca95e.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/ameliee_garment.jpg",
      "sha256": "ccde6967b35dbc6025b67c393743defcc0c0cfcb22ee97c6ed5e2ec313b48ce2",
      "sizeBytes": 96528,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/ameliee_garment.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/bliss_shop.webp",
      "sha256": "d09ac411a7b40d615c444bd9bfd277fb6ca3959d1d06c35f0f2ef6718970bdd6",
      "sizeBytes": 166656,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".webp",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/bliss_shop.webp",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "sha256": "bb93b72ae214d11ad0521ae37cf8cd40ff57a6e0651969edefb4b1d1e69b46b8",
      "sizeBytes": 114737,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/chouchou_1kem.jpg",
      "sha256": "e22f3d36d93ab6aec0ef8cb91baece1b74eec6ab8d1187cd8cf76bdca1e01ddf",
      "sizeBytes": 108818,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/chouchou_1kem.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/chouchou-1kem-e22f3d36d93a.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/chouchou-1kem-e22f3d36d93a.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/chouchou_1xanh_bien.png",
      "sha256": "20953e05ba4832c9c0f6d160e337a7bcf8eaa4f065f34ecbaeeb6f22c549dbd1",
      "sizeBytes": 645544,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/chouchou_1xanh_bien.png",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/chouchou-1xanh-bien-20953e05ba48.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/chouchou-1xanh-bien-20953e05ba48.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/d.chic_vay_maxi.jpg",
      "sha256": "4ea56c16ddb16ce4d2718f04aa58304e3018202df922c5dd4dc105429694abf1",
      "sizeBytes": 509307,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/d.chic_vay_maxi.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/d-chic-vay-maxi-4ea56c16ddb1.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/d-chic-vay-maxi-4ea56c16ddb1.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/flane_ren_bo_mui_tre_vai.jpg",
      "sha256": "de0c667f796d7d5cfd709a3214a36f603607a0961aa7c3cfc0fa26ce81e3ccdf",
      "sizeBytes": 204013,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/flane_ren_bo_mui_tre_vai.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/flane_ren_co_yem.jpg",
      "sha256": "1939b585e2b81b7d29e12e9f17c80847c07a8c7e11072fa6eb60db53b08a26e7",
      "sizeBytes": 104835,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/flane_ren_co_yem.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/flane_vay2.webp",
      "sha256": "008f744fd0a33b47e7b8d7ae898795966571a2d092813385bc6d85a697107216",
      "sizeBytes": 369844,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".webp",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/flane_vay2.webp",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/flane-vay2-008f744fd0a3.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/flane-vay2-008f744fd0a3.webp",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/flane_vay3.png",
      "sha256": "8e82cd0ca940c782aba222e9a81aaa67d0de1b6aead58310d3f581b29394de38",
      "sizeBytes": 100228,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/flane_vay3.png",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/flane-vay3-8e82cd0ca940.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/flane-vay3-8e82cd0ca940.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/jolie_loft_lua.jpg",
      "sha256": "540f8a0c0d21f3a592188ab604b93cd960ebd3f847d5e374b5668c3bb126d92b",
      "sizeBytes": 59221,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_lua.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "sha256": "d92038751836eb0c26f47f07bedb0fc5bf72a0c528ccf7cce01a0f7ffa6768f4",
      "sizeBytes": 257586,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/jolie_loft_vay_ren_co_tay.jpg",
      "sha256": "3711af677a875147e0707f43e081871fe81f7291ab78158b1261ef181d8e41bf",
      "sizeBytes": 101928,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_vay_ren_co_tay.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/maison_long_thuy_mi.jpg",
      "sha256": "ba34b0b1185569267fd687a30406e133b453c541725cafaefaa6868ab5acbce8",
      "sizeBytes": 151053,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/maison_long_thuy_mi.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/ononmade_lapetra.png",
      "sha256": "b8eeb387a576858c6a7062d3f83cff0462a0c964b09993a190ed0667304d4f6c",
      "sizeBytes": 122413,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/ononmade_lapetra.png",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/ononmade-lapetra-b8eeb387a576.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/ononmade-lapetra-b8eeb387a576.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/set_vay_2_day_chan_vay_trang_kem_lannie.jpg",
      "sha256": "6f9b34578bac1aa43eddb0fb73f2b7192fb7d02431dfd50051362edafb66ca0a",
      "sizeBytes": 65295,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/set_vay_2_day_chan_vay_trang_kem_lannie.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/so_vintage_evelina.jpg",
      "sha256": "10274dc315acaa8301f3812abcc2ff42d5f64b06f9e151d83b291b0f9e2df984",
      "sizeBytes": 124185,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/so_vintage_evelina.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/so-vintage-evelina-10274dc315ac.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/so-vintage-evelina-10274dc315ac.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/so_vintage_kasia.jpg",
      "sha256": "58112c49e29504f407613e038448792d3faaee4341d84ee385ccb5fc4b421939",
      "sizeBytes": 25068,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/so_vintage_kasia.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/so-vintage-kasia-58112c49e295.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/so-vintage-kasia-58112c49e295.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "sha256": "04c915896be09222afe470a372392df9903b7a0ef8f8f70643477b58c499cc91",
      "sizeBytes": 146101,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/vay_hoa_mua_he.jpg",
      "sha256": "d401aad8191e3a3976d1cafddcce2b7bb7bffad3da65289aec783fd34b1afb12",
      "sizeBytes": 189268,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/vay_hoa_mua_he.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/vay_ren_phoi_to.jpg",
      "sha256": "558d4ffd5f686d86e0c98b139fd0d529f4f0d46559cd0f94423c9d75c076af79",
      "sizeBytes": 121317,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/vay_ren_phoi_to.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_di_bien/vn-11134207-7ra0g-m94acl0rf23ybe.jpg",
      "sha256": "d09ac411a7b40d615c444bd9bfd277fb6ca3959d1d06c35f0f2ef6718970bdd6",
      "sizeBytes": 166656,
      "detectedMime": "image/webp",
      "detectedExtension": ".webp",
      "originalExtension": ".jpg",
      "category": "products/vay-di-bien",
      "canonicalSourcePath": "image/vay_di_bien/bliss_shop.webp",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
      "duplicateOfSourcePath": "image/vay_di_bien/bliss_shop.webp",
      "duplicateOfKey": "products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_du_tiec/amelie_vanessa_dress_xanh_nhat.jpg",
      "sha256": "f3db7d3e4f8adb628e1f6fd7a5f7df6a1b2af13a055dfed6f0d1be3dde38c51b",
      "sizeBytes": 332184,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg",
      "duplicateOfKey": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_du_tiec/chouchou_dam_dai_ren_choang.jpg",
      "sha256": "345fd9ebe974d4f5194e99d121bb47eb88b8f3464cad50cff5078de3fd623e69",
      "sizeBytes": 367741,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/chouchou_dam_dai_ren_choang.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/chouchou_dam_ren_nude_dang_dai.jpg",
      "sha256": "bb93b72ae214d11ad0521ae37cf8cd40ff57a6e0651969edefb4b1d1e69b46b8",
      "sizeBytes": 114737,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg",
      "duplicateOfKey": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_du_tiec/huong_boutique_louise_lace_dress.jpg",
      "sha256": "1be1361fc9236a6edbeb333519d64369303ad9120d7f3aaac3fc54dd06b2f7ed",
      "sizeBytes": 242269,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/huong_boutique_louise_lace_dress.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "sha256": "44d474fd0419c7e467d94c1ac2fb7e2fe92e2fd5936bce393872b09503dac24d",
      "sizeBytes": 63937,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png",
      "sha256": "1e3a1a9cd26e93cc91b0782863724cabffd621325221de627b58bc7d58f3fab0",
      "sizeBytes": 131517,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "sha256": "d92038751836eb0c26f47f07bedb0fc5bf72a0c528ccf7cce01a0f7ffa6768f4",
      "sizeBytes": 257586,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "duplicateOfKey": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_lafine.jpg",
      "sha256": "2f073b76c8e4d0181c634923d6e155905bf1690745aa1effad55876a4bda8abc",
      "sizeBytes": 46313,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_lafine.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_lyra.jpg",
      "sha256": "9e14be9fc742c115a204cbae1c7bdd0aad41cc469ab98e312f8d42c3aa409884",
      "sizeBytes": 61232,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_lyra.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_nathalia.jpg",
      "sha256": "dd392dda95e495674d2f48e3372c96103588629f668e6982e2c330f6bf8695c4",
      "sizeBytes": 84595,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_nathalia.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_velia.jpg",
      "sha256": "3ec75e026681c66029876f279dc327b19e0f5b1494a4f17def761c9261764fc4",
      "sizeBytes": 75690,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_velia.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_velia(den).jpg",
      "sha256": "497b75ce734fa412ae266ffd9930c9e2e24b968dc8ad14066998a5d9c652bf56",
      "sizeBytes": 157002,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_velia(den).jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_veliana.png",
      "sha256": "651d05688ec498859da1f4807e61345d6d80cea6209b3f8d546cf6b2349c3280",
      "sizeBytes": 156282,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_veliana.png",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/so_vintage_veliana(den).jpg",
      "sha256": "89e3bccbb579ec17610df68acab777a10a04ed05a897545587f76936286fa0f4",
      "sizeBytes": 52318,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_veliana(den).jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_du_tiec/tipblu_dam_voan_tim_lavender.jpg",
      "sha256": "04c915896be09222afe470a372392df9903b7a0ef8f8f70643477b58c499cc91",
      "sizeBytes": 146101,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "duplicateOfKey": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_du_tiec/wonder_house_lua_dress_kem.jpg",
      "sha256": "2b53e05ea2bdcf2c49158b5520cef1f40aaaa44ee1cfe6030cf3e3df8752392b",
      "sizeBytes": 80784,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-du-tiec",
      "canonicalSourcePath": "image/vay_du_tiec/wonder_house_lua_dress_kem.jpg",
      "isCanonical": true,
      "r2Key": "products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "image/vay_lua/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "sha256": "44d474fd0419c7e467d94c1ac2fb7e2fe92e2fd5936bce393872b09503dac24d",
      "sizeBytes": 63937,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-lua",
      "canonicalSourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "duplicateOfSourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "duplicateOfKey": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_lua/jolie_loft_lua.jpg",
      "sha256": "540f8a0c0d21f3a592188ab604b93cd960ebd3f847d5e374b5668c3bb126d92b",
      "sizeBytes": 59221,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-lua",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_lua.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/jolie_loft_lua.jpg",
      "duplicateOfKey": "products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_lua/jolie_loft_vaylua_dress.png",
      "sha256": "1e3a1a9cd26e93cc91b0782863724cabffd621325221de627b58bc7d58f3fab0",
      "sizeBytes": 131517,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "products/vay-lua",
      "canonicalSourcePath": "image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png",
      "isCanonical": false,
      "r2Key": "products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
      "duplicateOfSourcePath": "image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png",
      "duplicateOfKey": "products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "image/vay_lua/wonder_house_lua_dress_kem.jpg",
      "sha256": "2b53e05ea2bdcf2c49158b5520cef1f40aaaa44ee1cfe6030cf3e3df8752392b",
      "sizeBytes": 80784,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "products/vay-lua",
      "canonicalSourcePath": "image/vay_du_tiec/wonder_house_lua_dress_kem.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
      "duplicateOfSourcePath": "image/vay_du_tiec/wonder_house_lua_dress_kem.jpg",
      "duplicateOfKey": "products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "jolie-loft-dam-lua-kem-hali-dress.jpg",
      "sha256": "44d474fd0419c7e467d94c1ac2fb7e2fe92e2fd5936bce393872b09503dac24d",
      "sizeBytes": 63937,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "duplicateOfSourcePath": "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg",
      "duplicateOfKey": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "jolie-loft-vay-luoi-molly-dress-nau.jpg",
      "sha256": "d92038751836eb0c26f47f07bedb0fc5bf72a0c528ccf7cce01a0f7ffa6768f4",
      "sizeBytes": 257586,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg",
      "duplicateOfKey": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "Logo.png",
      "sha256": "9045f298df8419b380514d8f0cc649032c3d8515602283844351745a32df7c6f",
      "sizeBytes": 81956,
      "detectedMime": "image/png",
      "detectedExtension": ".png",
      "originalExtension": ".png",
      "category": "ui",
      "canonicalSourcePath": "Logo.png",
      "isCanonical": true,
      "r2Key": "ui/logo-9045f298df84.png",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/ui/logo-9045f298df84.png",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "nguyen_duc_duong.jpg",
      "sha256": "db37e8cc41492ee2a8f8b6d8d17802449f485bc81a96243c6ce798c58f038776",
      "sizeBytes": 5604,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "nguyen_duc_duong.jpg",
      "isCanonical": true,
      "r2Key": "team/nguyen-duc-duong-db37e8cc4149.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/nguyen-duc-duong-db37e8cc4149.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "phan_huyen_tran.jpg",
      "sha256": "3c787b97b694d5407c587a3cb9cf9e786fbe510af350a83d745cf9511aaabc29",
      "sizeBytes": 150399,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "phan_huyen_tran.jpg",
      "isCanonical": true,
      "r2Key": "team/phan-huyen-tran-3c787b97b694.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/phan-huyen-tran-3c787b97b694.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "so-vintage-nathalia.jpg",
      "sha256": "dd392dda95e495674d2f48e3372c96103588629f668e6982e2c330f6bf8695c4",
      "sizeBytes": 84595,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_du_tiec/so_vintage_nathalia.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
      "duplicateOfSourcePath": "image/vay_du_tiec/so_vintage_nathalia.jpg",
      "duplicateOfKey": "products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "step-robot.jpg",
      "sha256": "ac03f5f13489191a4e0b25875c5c3b2bef483c2b439a7e74bcf933619fcfa5f5",
      "sizeBytes": 7867,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "step-robot.jpg",
      "isCanonical": true,
      "r2Key": "ui/step-robot-ac03f5f13489.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/ui/step-robot-ac03f5f13489.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "step-search.jpg",
      "sha256": "59436d703cb5e1a3f6c96fedbaa8bcad90f45eac96a899087231b8c456895077",
      "sizeBytes": 3608,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "step-search.jpg",
      "isCanonical": true,
      "r2Key": "ui/step-search-59436d703cb5.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/ui/step-search-59436d703cb5.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "step-truck.jpg",
      "sha256": "ed32da7a6fe3adcdad72e72a964b4793ff9e537aa8ff1020540fe35a12a7f61b",
      "sizeBytes": 11845,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "step-truck.jpg",
      "isCanonical": true,
      "r2Key": "ui/step-truck-ed32da7a6fe3.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/ui/step-truck-ed32da7a6fe3.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 0,
      "references": [],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    },
    {
      "sourcePath": "tipblu-dam-voan-tim-lavender.jpg",
      "sha256": "04c915896be09222afe470a372392df9903b7a0ef8f8f70643477b58c499cc91",
      "sizeBytes": 146101,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "ui",
      "canonicalSourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "isCanonical": false,
      "r2Key": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "duplicateOfSourcePath": "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg",
      "duplicateOfKey": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
      "referenceCount": 0,
      "references": [],
      "uploaded": false,
      "s3Verified": false,
      "publicVerified": false
    },
    {
      "sourcePath": "tran_bao_lam.jpg",
      "sha256": "ef0fd0191017445a8e27f379099e42ce2013f63c2b36aef97ded458cac37c3d5",
      "sizeBytes": 73746,
      "detectedMime": "image/jpeg",
      "detectedExtension": ".jpg",
      "originalExtension": ".jpg",
      "category": "team",
      "canonicalSourcePath": "tran_bao_lam.jpg",
      "isCanonical": true,
      "r2Key": "team/tran-bao-lam-ef0fd0191017.jpg",
      "publicUrl": "https://pub-6ea0ae14ead64cf8bcaaea62c246f5d9.r2.dev/team/tran-bao-lam-ef0fd0191017.jpg",
      "duplicateOfSourcePath": null,
      "duplicateOfKey": null,
      "referenceCount": 1,
      "references": [
        "repository text reference"
      ],
      "uploaded": true,
      "s3Verified": true,
      "publicVerified": true
    }
  ]
}
```

## `tools/catalog/README.md`

```md
# Catalog Seed

Generate an idempotent MySQL seed file from the legacy frontend catalog:

```bash
node tools/catalog/generate-legacy-catalog-seed.js
```

The generated SQL is written to:

```text
database/seed-legacy-catalog.mysql.sql
```

Before running it against production, review the variables at the top of the SQL.
By default it uses the first active shop. If no active shop exists, it creates a
disabled seed owner and a catalog seed shop so product visibility still works.

Image URLs are generated from `frontend/src/assets/asset-map.json` when a mapping
exists. Otherwise the original legacy image path is kept and can be replaced later.
```

## `tools/catalog/generate-legacy-catalog-seed.js`

```js
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assetMap from '../../frontend/src/assets/asset-map.json' with { type: 'json' };
import { products } from '../../frontend/src/features/catalog/data/products.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = resolve(__dirname, '../../database/seed-legacy-catalog.mysql.sql');
const outputArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputPath = outputArg ? resolve(process.cwd(), outputArg.slice('--out='.length)) : defaultOutputPath;

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function parsePrice(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : null;
}

function parseExtraDayPrice(value) {
  return parsePrice(value) || 0;
}

function uniqueBy(items, keySelector) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keySelector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const categories = uniqueBy(
  products.map((product) => ({
    name: product.categoryLabel,
    slug: product.category,
  })),
  (category) => category.slug,
).sort((left, right) => left.slug.localeCompare(right.slug));

const brands = uniqueBy(
  products.map((product) => ({
    name: product.brand || 'Khac',
    slug: slugify(product.brand || 'Khac'),
  })),
  (brand) => brand.slug,
).sort((left, right) => left.slug.localeCompare(right.slug));

const lines = [
  '-- Generated by tools/catalog/generate-legacy-catalog-seed.js',
  '-- Idempotent MySQL seed for the legacy DoRentMe catalog.',
  '-- Review @dorentme_seed_* variables before running against production.',
  '',
  'START TRANSACTION;',
  '',
  "SET @dorentme_seed_owner_email = 'catalog-seed@dorentme.local';",
  "SET @dorentme_seed_shop_name = 'DoRentMe Catalog Seed Shop';",
  'SET @dorentme_seed_shop_id = (SELECT Id FROM Shops WHERE IsActive = 1 ORDER BY Id LIMIT 1);',
  '',
  "INSERT INTO Roles (Code, Name, Description, CreatedAt)",
  "SELECT 'LENDER', 'Lender', 'Lender role', UTC_TIMESTAMP()",
  "WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Code = 'LENDER');",
  '',
  'SET @dorentme_lender_role_id = (SELECT Id FROM Roles WHERE Code = \'LENDER\' LIMIT 1);',
  '',
  'INSERT INTO Users (RoleId, Name, Email, Phone, PasswordHash, LoyaltyPoints, IsActive, CreatedAt)',
  "SELECT @dorentme_lender_role_id, 'Catalog Seed Owner', @dorentme_seed_owner_email, NULL, 'SEEDED_DISABLED_LOGIN', 0, 0, UTC_TIMESTAMP()",
  'WHERE @dorentme_seed_shop_id IS NULL',
  '  AND NOT EXISTS (SELECT 1 FROM Users WHERE Email = @dorentme_seed_owner_email);',
  '',
  'SET @dorentme_seed_owner_id = (SELECT Id FROM Users WHERE Email = @dorentme_seed_owner_email LIMIT 1);',
  '',
  'INSERT INTO Shops (Name, OwnerUserId, Phone, Email, Address, IsActive, CreatedAt)',
  "SELECT @dorentme_seed_shop_name, @dorentme_seed_owner_id, '0000000000', @dorentme_seed_owner_email, 'Seeded catalog shop', 1, UTC_TIMESTAMP()",
  'WHERE @dorentme_seed_shop_id IS NULL',
  '  AND NOT EXISTS (SELECT 1 FROM Shops WHERE Name = @dorentme_seed_shop_name);',
  '',
  'SET @dorentme_seed_shop_id = COALESCE(@dorentme_seed_shop_id, (SELECT Id FROM Shops WHERE Name = @dorentme_seed_shop_name LIMIT 1));',
  '',
];

for (const category of categories) {
  lines.push(
    'INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)',
    `SELECT ${sqlString(category.name)}, ${sqlString(category.slug)}, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = ${sqlString(category.slug)});`,
    '',
  );
}

for (const brand of brands) {
  lines.push(
    'INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)',
    `SELECT ${sqlString(brand.name)}, ${sqlString(brand.slug)}, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = ${sqlString(brand.slug)});`,
    '',
  );
}

for (const product of products) {
  const productSlug = slugify(`${product.category}-${product.name}-${product.id}`);
  const categorySlug = product.category;
  const brandSlug = slugify(product.brand || 'Khac');
  const price1Day = parsePrice(product.price1day) || 0;
  const price3Day = parsePrice(product.price3day) || price1Day;
  const extraDayPrice = parseExtraDayPrice(product.priceExtra);
  const priceTag = parsePrice(product.priceTag);
  const priceDeposit = parsePrice(product.priceDeposit) || 0;
  const imageUrl = assetMap[product.image] || product.image;
  const variantCode = `LEGACY-${productSlug}-FREESIZE-ASSORTED`.slice(0, 100);
  const assetCode = `LEGACY-${productSlug}-001`.slice(0, 100);

  lines.push(
    `-- ${product.name}`,
    'SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = ' + sqlString(categorySlug) + ' LIMIT 1);',
    'SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = ' + sqlString(brandSlug) + ' LIMIT 1);',
    '',
    'INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)',
    `SELECT @dorentme_seed_shop_id, @dorentme_brand_id, ${sqlString(product.name)}, ${sqlString(productSlug)}, ${sqlString(product.categoryLabel)}, ${price1Day}, ${price3Day}, ${extraDayPrice}, ${priceTag ?? 'NULL'}, ${priceDeposit}, NULL, 0, 0, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = ${sqlString(productSlug)});`,
    '',
    `SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = ${sqlString(productSlug)} LIMIT 1);`,
    '',
    'INSERT INTO ProductCategories (ProductId, CategoryId)',
    'SELECT @dorentme_product_id, @dorentme_category_id',
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND @dorentme_category_id IS NOT NULL',
    '  AND NOT EXISTS (',
    '    SELECT 1 FROM ProductCategories',
    '    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id',
    '  );',
    '',
    'INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)',
    `SELECT @dorentme_product_id, ${sqlString(imageUrl)}, CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()`,
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = ' + sqlString(imageUrl) + ');',
    '',
    'INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)',
    `SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', ${sqlString(variantCode)}, 1, UTC_TIMESTAMP()`,
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = \'FREESIZE\' AND Color = \'ASSORTED\');',
    '',
    `SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);`,
    '',
    'INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)',
    `SELECT @dorentme_variant_id, ${sqlString(assetCode)}, 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()`,
    'WHERE @dorentme_variant_id IS NOT NULL',
    `  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = ${sqlString(assetCode)});`,
    '',
  );
}

lines.push(
  'COMMIT;',
  '',
  `-- Seeded products: ${products.length}`,
  `-- Seeded categories: ${categories.length}`,
  `-- Seeded brands: ${brands.length}`,
);

writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`Generated ${outputPath}`);
console.log(`products=${products.length}`);
console.log(`categories=${categories.length}`);
console.log(`brands=${brands.length}`);
```

