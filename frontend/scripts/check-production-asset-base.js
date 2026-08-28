import { readFileSync } from 'node:fs';

const envText = readFileSync(new URL('../.env.production', import.meta.url), 'utf8');
const match = envText.match(/^VITE_ASSET_BASE_URL=(.+)$/m);
const value = match?.[1]?.trim();

if (!value) {
  throw new Error('VITE_ASSET_BASE_URL is missing from frontend/.env.production');
}

if (!/^https:\/\/.+/i.test(value)) {
  throw new Error('VITE_ASSET_BASE_URL must be an absolute HTTPS URL');
}

console.log('production asset base check passed');
