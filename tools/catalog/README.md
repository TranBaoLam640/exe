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
