import assetMap from '../src/assets/asset-map.json' with { type: 'json' };
import { products } from '../src/features/catalog/data/products.js';
import { filterProducts, getFallbackProduct, getProductById, getProductByLegacyIndex, ITEMS_PER_PAGE, paginateProducts } from '../src/features/catalog/services/catalogService.js';

const failures = [];
const ids = new Set(products.map((product) => product.id));
const duplicateNames = products.filter((product, index) => products.findIndex((item) => item.name === product.name) !== index);
const mappedImages = products.filter((product) => assetMap[product.image]);

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(products.length === 52, `expected 52 products, got ${products.length}`);
check(ids.size === 52, `expected 52 unique IDs, got ${ids.size}`);
check(duplicateNames.length > 0, 'expected duplicate names to remain represented');
check(mappedImages.length === 52, `expected 52 R2 image mappings, got ${mappedImages.length}`);

const sample = products.find((product) => product.image === 'image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg');
check(sample && getProductById(sample.id)?.image === sample.image, 'getProductById did not return the expected product');
check(getProductByLegacyIndex('1') === products[1], 'legacy productDetail numeric id=1 fallback changed');
check(getProductByLegacyIndex('missing') === null, 'invalid legacy productDetail numeric id should not resolve');
check(getFallbackProduct().image === 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg', 'fallback product changed');

check(filterProducts({ category: 'ao-dai', brand: 'all', query: '' }).length === 10, 'default ao-dai category count changed');
check(filterProducts({ category: 'thanh-ly', brand: 'all', query: '' }).length === 0, 'thanh-ly should remain empty');
check(filterProducts({ category: 'all', brand: 'LANE JT', query: '' }).length === 0, 'absent brand LANE JT should remain empty');
check(filterProducts({ category: 'all', brand: 'all', query: 'tipblu' }).length === 2, 'case-insensitive name search changed');
check(filterProducts({ category: 'all', brand: 'all', query: ' tipblu' }).length === 0, 'search should not trim query');
check(filterProducts({ category: 'vay-di-bien', brand: 'FLANE', query: 'ren' }).length === 2, 'category + brand + query AND semantics changed');

const allPagination = paginateProducts(products, 1, ITEMS_PER_PAGE);
check(ITEMS_PER_PAGE === 15, `expected ITEMS_PER_PAGE 15, got ${ITEMS_PER_PAGE}`);
check(allPagination.items.length === 15, `expected first page length 15, got ${allPagination.items.length}`);
check(allPagination.totalPages === 4, `expected 4 total pages for 52 products, got ${allPagination.totalPages}`);
check(!products.some((product) => Object.hasOwn(product, 'sort')), 'sorting field should not exist');

if (failures.length) {
  console.error(`catalog validation FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('catalog validation PASS');
console.log(`products=${products.length}`);
console.log(`uniqueIds=${ids.size}`);
console.log(`duplicateNames=${new Set(duplicateNames.map((product) => product.name)).size}`);
console.log(`r2Mappings=${mappedImages.length}`);
