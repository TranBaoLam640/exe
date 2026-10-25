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


## Google sign-in configuration

1. In Google Cloud Console, configure the OAuth consent screen and create an OAuth Client ID of type **Web application**.
2. Add `https://dorentme.wdchocopie.id.vn` to **Authorized JavaScript origins**. For local development, also add the exact Vite origin (for example `http://localhost:5173`). The GIS popup callback does not require an application redirect URL. If the consent screen is in Testing, add the intended Google accounts as test users.
3. Locally set `VITE_GOOGLE_CLIENT_ID` in the frontend environment, and set `GoogleAuth__ClientId` in the backend environment to the same Web Client ID.
4. For production, set the GitHub Actions repository variable `GOOGLE_CLIENT_ID` (Settings > Secrets and variables > Actions > Variables). Set `GoogleAuth__ClientId` in the Kubernetes `backend-config` ConfigMap to that same value. The frontend Docker build passes this public ID through to Vite; rebuild and redeploy both applications after configuring it. The GoogleSubject migration runs through the existing deployment migration job.
5. Verify that clicking the visible Google button opens Google's account chooser and produces a successful `/api/auth/google` response containing the application's JWT. Verify `/api/auth/me` and cart access with that session.

No Google Client Secret is needed for this GIS ID-token flow. Never put a Client Secret in a `VITE_*` variable. Without a real Client ID, the page displays a configuration message and email/password login remains available. API errors never create a local placeholder session.

References: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid and https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
