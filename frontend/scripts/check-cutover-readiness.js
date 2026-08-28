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
  'api/chat.js',
  'api/tryon.js',
];

for (const file of legacyFiles) {
  check(existsSync(new URL(file, root)), `legacy file should remain for Phase 7B: ${file}`);
}
check(existsSync(new URL('image/', root)), 'legacy image/ directory should remain for Phase 7B');

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

if (failures.length) {
  console.error(`cutover readiness FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('cutover readiness PASS');
console.log('legacyFilesRetained=true');
console.log('loyaltyRoute=/loyalty');
console.log('spaFallbackExcludesApi=true');
console.log(`legacyRedirects=${requiredRedirects.size}`);
