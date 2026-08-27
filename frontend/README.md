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
