import { products } from '../data/products.js';

export const ITEMS_PER_PAGE = 15;

export const categoryOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'ao-dai', label: 'Áo dài' },
  { value: 'vay-di-bien', label: 'Váy đi biển' },
  { value: 'vay-du-tiec', label: 'Váy dự tiệc' },
  { value: 'phu-kien', label: 'Phụ kiện' },
  { value: 'vay-lua', label: 'Váy lụa' },
  { value: 'thanh-ly', label: 'Thanh lý' },
];

export const brandOptions = [
  { value: 'all', label: 'Tất cả' },
  { value: 'SÒ VINTAGE', label: 'SÒ VINTAGE' },
  { value: 'D.CHIC', label: 'D.CHIC' },
  { value: 'FLANE', label: 'FLANE' },
  { value: 'LANE JT', label: 'LANE JT' },
  { value: 'HƯƠNG BOUTIQUE', label: 'HƯƠNG BOUTIQUE' },
  { value: 'CHIRON', label: 'CHIRON' },
  { value: 'JOLIE LOFT', label: 'JOLIE LOFT' },
  { value: 'MAISON LONG', label: 'MAISON LONG' },
  { value: 'Mys.P', label: 'Mys.P' },
  { value: 'KYCÉ', label: 'KYCÉ' },
  { value: 'Mainichi', label: 'Mainichi' },
  { value: 'ONONMADE', label: 'ONONMADE' },
  { value: 'JENNIE CHOO', label: 'JENNIE CHOO' },
  { value: 'AMELIEE', label: 'AMELIEE' },
  { value: 'CHOUCHOU', label: 'CHOUCHOU' },
  { value: 'Bliss Shop', label: 'Bliss Shop' },
  { value: 'Khác', label: 'Khác' },
];

export function getProducts() {
  return products;
}

export function getProductById(id) {
  return products.find((product) => product.id === id) || null;
}

export function getFallbackProduct() {
  return products.find((product) => product.image === 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg') || products[0];
}

export function filterProducts({ category = 'all', brand = 'all', query = '' } = {}) {
  return products.filter((product) => {
    const inCategory = category === 'all' || product.category === category;
    const inBrand = brand === 'all' || product.brand === brand;
    const matchesSearch = query === '' || product.name.toLowerCase().includes(query.toLowerCase());
    return inCategory && inBrand && matchesSearch;
  });
}

export function paginateProducts(productList, page, itemsPerPage = ITEMS_PER_PAGE) {
  const totalPages = Math.ceil(productList.length / itemsPerPage);
  const start = (page - 1) * itemsPerPage;
  return {
    items: productList.slice(start, start + itemsPerPage),
    totalPages,
  };
}
