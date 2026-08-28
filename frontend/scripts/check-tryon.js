import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { joinAssetUrl } from '../src/utils/assetUrl.js';
import { products } from '../src/features/catalog/data/products.js';
import { addProductToCart } from '../src/features/cart/cartService.js';
import {
  TRYON_IMAGE_MAX_DIMENSION,
  TRYON_IMAGE_MIME_TYPE,
  TRYON_IMAGE_QUALITY,
  getContainedImageSize,
  isSupportedImageFile,
} from '../src/features/ai/tryon/imageProcessing.js';
import { TRYON_API_URL, createTryOn, getApiErrorMessage, getTryOnStatus } from '../src/features/ai/tryon/tryOnService.js';
import { getProviderGarmentUrl, resolveTryOnProduct } from '../src/features/ai/tryon/tryOnProduct.js';
import { MAX_TRIES_PER_SESSION, TRYON_COUNT_KEY, bumpTryOnCount, canUseTryOn, getTryOnCount } from '../src/features/ai/tryon/tryOnSession.js';
import { TRYON_MAX_POLL_ATTEMPTS, TRYON_POLL_INTERVAL_MS, pollTryOnStatus } from '../src/features/ai/tryon/tryOnPolling.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
  };
}

const sampleProduct = products[0];
assert.equal(TRYON_API_URL, '/api/tryon');
assert.equal(TRYON_IMAGE_MAX_DIMENSION, 1024);
assert.equal(TRYON_IMAGE_MIME_TYPE, 'image/jpeg');
assert.equal(TRYON_IMAGE_QUALITY, 0.85);

assert.deepEqual(getContainedImageSize(2000, 1000), { width: 1024, height: 512 });
assert.deepEqual(getContainedImageSize(800, 1600), { width: 512, height: 1024 });
assert.deepEqual(getContainedImageSize(640, 480), { width: 640, height: 480 });
assert.equal(isSupportedImageFile({ type: 'image/png' }), true);
assert.equal(isSupportedImageFile({ type: 'text/plain' }), false);

let request;
const createResult = await createTryOn(
  { humanImage: 'data:image/jpeg;base64,abc', garmentImageUrl: 'https://assets.example.com/product.jpg' },
  {
    fetcher: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ requestId: 'req_123' }) };
    },
  },
);
assert.deepEqual(createResult, { requestId: 'req_123' });
assert.equal(request.url, '/api/tryon');
assert.equal(request.options.method, 'POST');
assert.equal(request.options.headers['Content-Type'], 'application/json');
assert.deepEqual(JSON.parse(request.options.body), {
  humanImage: 'data:image/jpeg;base64,abc',
  garmentImageUrl: 'https://assets.example.com/product.jpg',
});

await assert.rejects(
  () =>
    createTryOn(
      { humanImage: 'data:image/jpeg;base64,abc', garmentImageUrl: 'https://assets.example.com/product.jpg' },
      { fetcher: async () => ({ ok: true, json: async () => ({}) }) },
    ),
  /mã yêu cầu/,
);

await assert.rejects(
  () =>
    createTryOn(
      { humanImage: 'data:image/jpeg;base64,abc', garmentImageUrl: 'https://assets.example.com/product.jpg' },
      { fetcher: async () => ({ ok: false, json: async () => ({ error: { message: 'Nested failure' } }) }) },
    ),
  /Nested failure/,
);
assert.equal(getApiErrorMessage({ error: 'String failure' }), 'String failure');

let statusRequest;
const statusResult = await getTryOnStatus('req id', {
  fetcher: async (url, options) => {
    statusRequest = { url, options };
    return { ok: true, json: async () => ({ status: 'IN_QUEUE' }) };
  },
});
assert.deepEqual(statusResult, { status: 'IN_QUEUE' });
assert.equal(statusRequest.url, '/api/tryon?id=req%20id');
assert.equal(statusRequest.options.method, 'GET');

const selected = resolveTryOnProduct(new URLSearchParams(`product=${sampleProduct.id}`), products);
assert.equal(selected.source, 'react-id');
assert.equal(selected.product.id, sampleProduct.id);
assert.equal(resolveTryOnProduct(new URLSearchParams('product=missing'), products).source, 'none');

const legacyParams = new URLSearchParams({
  name: 'Legacy Product',
  image: sampleProduct.image,
  category: 'Legacy Category',
  price3day: '100.000 vnd',
  priceExtra: '',
  price1day: '80.000 vnd',
  priceTag: '500.000 vnd',
  priceDeposit: '200.000 vnd',
});
const legacySelected = resolveTryOnProduct(legacyParams, products);
assert.equal(legacySelected.source, 'legacy-query');
assert.equal(legacySelected.product.name, 'Legacy Product');

assert.equal(getProviderGarmentUrl(sampleProduct, () => 'https://assets.example.com/product.jpg'), 'https://assets.example.com/product.jpg');
assert.throws(() => getProviderGarmentUrl(sampleProduct, () => '/image/product.jpg'), /URL công khai/);

const assetMap = JSON.parse(readFileSync(new URL('../src/assets/asset-map.json', import.meta.url), 'utf8'));
const fakePublicBase = 'https://assets.example.com';
const missingMappings = products.filter((product) => !assetMap[product.image]);
assert.deepEqual(missingMappings, []);
const nonPublicUrls = products
  .map((product) => joinAssetUrl(fakePublicBase, assetMap[product.image]))
  .filter((url) => !/^https?:\/\//.test(url));
assert.deepEqual(nonPublicUrls, []);

const storage = createMemoryStorage();
assert.equal(getTryOnCount(storage), 0);
assert.equal(canUseTryOn(storage), true);
assert.equal(bumpTryOnCount(storage), 1);
storage.setItem(TRYON_COUNT_KEY, String(MAX_TRIES_PER_SESSION));
assert.equal(canUseTryOn(storage), false);

const progress = [];
const completed = await pollTryOnStatus('req_123', {
  getStatus: async () => [{ status: 'IN_QUEUE' }, { status: 'IN_PROGRESS' }, { status: 'COMPLETED', image: { url: 'https://assets.example.com/result.png' } }][progress.length],
  onProgress: (message) => progress.push(message),
  delay: async () => {},
});
assert.equal(completed.resultImageUrl, 'https://assets.example.com/result.png');
assert.deepEqual(progress, ['Đang chờ trong hàng đợi...', 'AI đang xử lý ảnh của bạn...']);

await assert.rejects(
  () =>
    pollTryOnStatus('req_123', {
      getStatus: async () => ({ status: 'FAILED', error: { message: 'Provider failed' } }),
      delay: async () => {},
    }),
  /Provider failed/,
);

await assert.rejects(
  () =>
    pollTryOnStatus('req_123', {
      getStatus: async () => ({ status: 'COMPLETED' }),
      delay: async () => {},
    }),
  /ảnh kết quả/,
);

await assert.rejects(
  () =>
    pollTryOnStatus('req_123', {
      getStatus: async () => ({ status: 'IN_PROGRESS' }),
      delay: async () => {},
      maxAttempts: 2,
    }),
  /quá lâu/,
);
assert.equal(TRYON_POLL_INTERVAL_MS, 3000);
assert.equal(TRYON_MAX_POLL_ATTEMPTS, 40);

let eventDetail = null;
const cartStorage = createMemoryStorage({ dorentme_cart: '[]' });
const eventTarget = {
  dispatchEvent(event) {
    eventDetail = event.detail;
  },
};
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};
const cart = addProductToCart(sampleProduct, 1, { storage: cartStorage, eventTarget });
assert.equal(cart.length, 1);
assert.equal(cart[0].qty, 1);
assert.equal(cart[0].image, sampleProduct.image);
assert.equal(Object.hasOwn(cart[0], 'garmentImageUrl'), false);
assert.equal(Object.hasOwn(cart[0], 'resultImageUrl'), false);
assert.deepEqual(eventDetail, cart);

console.log('Try-On validation passed');
