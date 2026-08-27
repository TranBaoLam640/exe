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
