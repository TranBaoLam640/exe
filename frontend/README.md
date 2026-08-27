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
