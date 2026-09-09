import {
  getFallbackProduct,
  getProductById,
  getProductByLegacyIndex,
  ITEMS_PER_PAGE,
  normalizeProduct,
  paginateProducts,
} from '../src/features/catalog/services/catalogService.js';

const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

const normalized = normalizeProduct({
  id: 7,
  name: 'Catalog API Dress',
  price1Day: 100000,
  price3Day: 250000,
  extraDayPrice: 70000,
  priceDeposit: 300000,
  priceTag: 900000,
  likeCount: 3,
  availableStock: 2,
  categories: [{ id: 1, name: 'Dress', slug: 'dress' }],
  brandName: 'DoRentMe Brand',
  primaryImage: {
    imageUrl: '/images/catalog-api-dress.jpg',
    isPrimary: true,
  },
});

check(ITEMS_PER_PAGE === 15, `expected ITEMS_PER_PAGE 15, got ${ITEMS_PER_PAGE}`);
check(normalized.id === 7, 'normalized product id changed');
check(normalized.image === '/images/catalog-api-dress.jpg', 'normalized product image changed');
check(normalized.category === 'dress', 'normalized product category slug changed');
check(normalized.brand === 'DoRentMe Brand', 'normalized product brand changed');
check(normalized.likes === 3, 'normalized product like count changed');
check(normalized.availableStock === 2, 'normalized product stock changed');
check(normalized.price1day.includes('100.000'), 'normalized 1-day price format changed');
check(normalized.price3day.includes('250.000'), 'normalized 3-day price format changed');

check(getFallbackProduct().image === 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg', 'fallback product image changed');
check(getProductById('1') === null, 'legacy getProductById should not return mock data');
check(getProductByLegacyIndex('1') === null, 'legacy numeric product fallback should not return mock data');

const page = paginateProducts([1, 2, 3, 4], 2, 2);
check(page.items.length === 2 && page.items[0] === 3, 'legacy paginate helper changed unexpectedly');
check(page.totalPages === 2, 'legacy paginate total pages changed unexpectedly');

if (failures.length) {
  console.error(`catalog validation FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('catalog validation PASS');
console.log('source=backend-api');
