import api from '../../../config/api.js';
import { formatVnd } from '../../cart/cartService.js';

export const ITEMS_PER_PAGE = 15;

const fallbackImage = 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg';

export const VIETNAMESE_CATEGORY_MAP = {
  'tat ca': 'Tất cả',
  'all': 'Tất cả',
  'ao dai': 'Áo dài',
  'ao-dai': 'Áo dài',
  'vay di bien': 'Váy đi biển',
  'vay-di-bien': 'Váy đi biển',
  'vay du tiec': 'Váy dự tiệc',
  'vay-du-tiec': 'Váy dự tiệc',
  'phu kien': 'Phụ kiện',
  'phu-kien': 'Phụ kiện',
  'vay lua': 'Váy lụa',
  'vay-lua': 'Váy lụa',
  'thanh ly': 'Thanh lý',
  'thanh-ly': 'Thanh lý',
};

export const VIETNAMESE_BRAND_MAP = {
  'tat ca': 'Tất cả',
  'all': 'Tất cả',
  'khac': 'Khác',
};

export function formatCategoryName(name, slug = '') {
  if (!name && !slug) return '';
  const slugKey = String(slug || '').trim().toLowerCase();
  const nameKey = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return VIETNAMESE_CATEGORY_MAP[slugKey] || VIETNAMESE_CATEGORY_MAP[nameKey] || name;
}

export function formatBrandName(name, slug = '') {
  if (!name && !slug) return '';
  const slugKey = String(slug || '').trim().toLowerCase();
  const nameKey = String(name || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return VIETNAMESE_BRAND_MAP[slugKey] || VIETNAMESE_BRAND_MAP[nameKey] || name;
}

export const categoryOptions = [
  { value: 'all', label: 'Tất cả' },
];

export const brandOptions = [
  { value: 'all', label: 'Tất cả' },
];

export function normalizeProduct(apiProduct = {}) {
  const primaryImage = apiProduct.primaryImage || apiProduct.images?.[0];
  const category = apiProduct.categories?.[0];
  const price1Day = Number(apiProduct.price1Day) || 0;
  const price3Day = Number(apiProduct.price3Day) || 0;
  const extraDayPrice = Number(apiProduct.extraDayPrice) || 0;
  const priceDeposit = Number(apiProduct.priceDeposit) || 0;

  const categorySlug = category?.slug || apiProduct.category || '';
  const rawCategoryLabel = category?.name || apiProduct.categoryLabel || '';
  const categoryLabel = formatCategoryName(rawCategoryLabel, categorySlug) || rawCategoryLabel;
  const brand = formatBrandName(apiProduct.brandName || apiProduct.brand || '');

  return {
    ...apiProduct,
    image: primaryImage?.imageUrl || fallbackImage,
    category: categorySlug,
    categoryLabel,
    brand,
    likes: apiProduct.likeCount || 0,
    rating: apiProduct.rating || 5,
    reviews: apiProduct.reviews || 0,
    price1day: formatVnd(price1Day),
    price3day: formatVnd(price3Day),
    priceTag: apiProduct.priceTag ? formatVnd(Number(apiProduct.priceTag)) : '',
    priceDeposit: formatVnd(priceDeposit),
    priceExtra: `Thêm ngày: ${formatVnd(extraDayPrice)}/ngày`,
    availableStock: apiProduct.availableStock || 0,
  };
}

export async function fetchProducts(params = {}) {
  const response = await api.get('/api/products', {
    params: buildCatalogParams(params),
    paramsSerializer: { indexes: null },
  });
  const page = response.data?.data || {};

  return {
    ...page,
    items: (page.items || []).map(normalizeProduct),
  };
}

export async function fetchProductById(id) {
  const response = await api.get(`/api/products/${id}`);
  return normalizeProduct(response.data?.data);
}

export async function fetchCategories() {
  const response = await api.get('/api/categories');
  return [
    { value: 'all', label: 'Tất cả' },
    ...(response.data?.data || []).map((category) => ({
      value: String(category.id),
      label: formatCategoryName(category.name, category.slug),
      slug: category.slug,
    })),
  ];
}

export async function fetchBrands() {
  const response = await api.get('/api/brands');
  return [
    { value: 'all', label: 'Tất cả' },
    ...(response.data?.data || []).map((brand) => ({
      value: String(brand.id),
      label: formatBrandName(brand.name, brand.slug),
      slug: brand.slug,
    })),
  ];
}

export async function favoriteProduct(id) {
  const response = await api.post(`/api/products/${id}/favorite`);
  return normalizeProduct(response.data?.data);
}

export async function unfavoriteProduct(id) {
  const response = await api.delete(`/api/products/${id}/favorite`);
  return normalizeProduct(response.data?.data);
}

export function getProducts() {
  return [];
}

export function getProductById() {
  return null;
}

export function getProductByLegacyIndex() {
  return null;
}

export function getFallbackProduct() {
  return normalizeProduct({
    id: 0,
    name: 'DoRentMe',
    price1Day: 0,
    price3Day: 0,
    extraDayPrice: 0,
    priceDeposit: 0,
    priceTag: 0,
    categories: [],
    variants: [],
    images: [{ imageUrl: fallbackImage }],
    likeCount: 0,
  });
}

export function filterProducts() {
  return [];
}

export function paginateProducts(productList, page, itemsPerPage = ITEMS_PER_PAGE) {
  const totalPages = Math.ceil(productList.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  return {
    items: productList.slice(start, start + itemsPerPage),
    totalPages,
  };
}

function buildCatalogParams(params) {
  const result = {
    search: params.query || undefined,
    brandId: params.brand && params.brand !== 'all' ? params.brand : undefined,
    shopId: params.shopId && params.shopId !== 'all' ? params.shopId : undefined,
    size: params.size || undefined,
    color: params.color || undefined,
    condition: params.condition || undefined,
    inStock: params.inStock || undefined,
    sortBy: params.sortBy || 'createdAt',
    sortDirection: params.sortDirection || 'desc',
    page: params.page || 1,
    pageSize: params.pageSize || ITEMS_PER_PAGE,
  };

  if (params.category && params.category !== 'all') {
    result.categoryIds = [params.category];
  }

  return result;
}
