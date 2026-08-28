import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const root = new URL('../../', import.meta.url);
const frontend = new URL('../', import.meta.url);

function readJson(path) {
  return JSON.parse(readFileSync(new URL(path, root), 'utf8'));
}

function readFrontend(path) {
  return readFileSync(new URL(path, frontend), 'utf8');
}

function check(condition, message) {
  if (!condition) failures.push(message);
}

const legacyFiles = [
  'index.html',
  'about.html',
  'contact.html',
  'policy.html',
  'terms.html',
  'tutorial.html',
  'loyalty.html',
  'news.html',
  'news_detail.html',
  'shop.html',
  'productDetail.html',
  'cart.html',
  'checkout.html',
  'login.html',
  'register.html',
  'orders.html',
  'order-tracking.html',
  'shop-admin.html',
  'chatbotAI.html',
  'ai-tryon.html',
  'products.js',
  'auth.js',
  'cart.js',
  'orders.js',
  'responsive.css',
  'Logo.png',
];

for (const file of legacyFiles) {
  check(!existsSync(new URL(file, root)), `legacy file should be absent after Phase 7C: ${file}`);
}
check(!existsSync(new URL('image/', root)), 'legacy image/ directory should be absent after Phase 7C');

const vercel = readJson('vercel.json');
check(vercel.installCommand === 'npm install --prefix frontend', 'vercel installCommand must install frontend dependencies');
check(vercel.buildCommand === 'npm run build --prefix frontend', 'vercel buildCommand must build the frontend package');
check(vercel.outputDirectory === 'frontend/dist', 'vercel outputDirectory must serve frontend/dist');
check(!Object.hasOwn(vercel, 'builds'), 'vercel.json must not use legacy builds configuration');
check(Array.isArray(vercel.redirects), 'vercel redirects must be configured');
check(Array.isArray(vercel.rewrites), 'vercel rewrites must be configured');
check(vercel.rewrites.some((rewrite) => rewrite.destination === '/index.html' && rewrite.source.includes('?!api/')), 'SPA fallback must exclude /api/*');

const requiredRedirects = new Map([
  ['/index.html', '/'],
  ['/loyalty.html', '/loyalty'],
  ['/news_detail.html', '/news_detail'],
  ['/productDetail.html', '/product'],
  ['/order-tracking.html', '/order-tracking'],
  ['/login.html', '/login'],
  ['/register.html', '/register'],
  ['/ai-tryon.html', '/ai-tryon'],
  ['/chatbotAI.html', '/chatbot'],
  ['/shop-admin.html', '/admin'],
]);
for (const [source, destination] of requiredRedirects) {
  check(
    vercel.redirects.some((redirect) => redirect.source === source && redirect.destination === destination),
    `missing Vercel redirect ${source} -> ${destination}`,
  );
}

const router = readFrontend('src/app/router.jsx');
for (const route of ['loyalty', 'product', 'order-tracking', 'loyalty.html', 'productDetail.html', 'order-tracking.html']) {
  check(router.includes(`path: '${route}'`), `missing React route for ${route}`);
}

const staleChecks = [
  ['src/components/layout/Header.jsx', ['/index.html']],
  ['src/components/layout/Footer.jsx', ['/loyalty.html']],
  ['src/pages/ShopPage.jsx', ['/index.html']],
  ['src/pages/LoginPage.jsx', ['/index.html']],
  ['src/pages/RegisterPage.jsx', ['/index.html']],
];
for (const [file, tokens] of staleChecks) {
  const contents = readFrontend(file);
  for (const token of tokens) {
    check(!contents.includes(token), `${file} still references ${token}`);
  }
}

check(readFrontend('src/pages/ProductDetailPage.jsx').includes('legacyProductFromParams'), 'Product Detail must preserve legacy query context');
check(readFrontend('src/pages/OrderTrackingPage.jsx').includes("searchParams.get('id')"), 'Order Tracking must preserve legacy id query context');
check(readFrontend('src/features/ai/tryon/tryOnProduct.js').includes('new URLSearchParams'), 'Try-On URL builder must preserve legacy product context');
check(readFrontend('.env.production').includes('VITE_ASSET_BASE_URL=https://'), 'frontend/.env.production must define public R2 asset base');

const manifest = readJson('tools/r2/asset-migration-manifest.json');
const assetMap = readJson('frontend/src/assets/asset-map.json');
const uniqueKeys = new Set(Object.values(assetMap));
check(Object.keys(assetMap).length === 86, `expected 86 logical asset-map entries, got ${Object.keys(assetMap).length}`);
check(uniqueKeys.size === 70, `expected 70 canonical R2 keys, got ${uniqueKeys.size}`);
check(manifest.summary?.sourceFileCount === 86, `expected manifest sourceFileCount 86, got ${manifest.summary?.sourceFileCount}`);
check(manifest.summary?.canonicalObjectCount === 70, `expected manifest canonicalObjectCount 70, got ${manifest.summary?.canonicalObjectCount}`);
for (const asset of manifest.assets || []) {
  check(assetMap[asset.sourcePath] === asset.r2Key, `runtime map mismatch for ${asset.sourcePath}`);
  check(!existsSync(new URL(asset.sourcePath, root)), `migrated physical image should be absent: ${asset.sourcePath}`);
}
check(existsSync(new URL('api/chat.js', root)), 'api/chat.js must remain');
check(existsSync(new URL('api/tryon.js', root)), 'api/tryon.js must remain');

if (failures.length) {
  console.error(`cutover readiness FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('cutover readiness PASS');
console.log('legacyFilesRemoved=true');
console.log('loyaltyRoute=/loyalty');
console.log('spaFallbackExcludesApi=true');
console.log(`legacyRedirects=${requiredRedirects.size}`);
console.log(`assetMapEntries=${Object.keys(assetMap).length}`);
console.log(`canonicalR2Keys=${uniqueKeys.size}`);
