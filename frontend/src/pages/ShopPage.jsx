import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CatalogPagination from '../features/catalog/components/CatalogPagination.jsx';
import ProductFilters from '../features/catalog/components/ProductFilters.jsx';
import ProductGrid from '../features/catalog/components/ProductGrid.jsx';
import ProductSearch from '../features/catalog/components/ProductSearch.jsx';
import { addProductToCart } from '../features/cart/cartService.js';
import { categoryOptions, filterProducts, ITEMS_PER_PAGE, paginateProducts } from '../features/catalog/services/catalogService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function ShopPage() {
  useDocumentTitle('Cửa Hàng | DoRentMe');
  const [category, setCategory] = useState('ao-dai');
  const [brand, setBrand] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const filteredProducts = useMemo(() => filterProducts({ category, brand, query }), [category, brand, query]);
  const { items, totalPages } = paginateProducts(filteredProducts, page, ITEMS_PER_PAGE);
  const categoryLabel = categoryOptions.find((option) => option.value === category)?.label || category;

  function changeCategory(nextCategory) {
    setCategory(nextCategory);
    setQuery('');
    setPage(1);
  }

  function changeBrand(nextBrand) {
    setBrand(nextBrand);
    setQuery('');
    setPage(1);
  }

  function changeQuery(nextQuery) {
    setQuery(nextQuery);
    setPage(1);
  }

  function changePage(nextPage) {
    if (nextPage < 1 || nextPage > totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  const resultLabel = filteredProducts.length === 0
    ? 'Không có kết quả'
    : query
      ? `Tìm thấy ${filteredProducts.length} kết quả cho "${query}"`
      : `Hiển thị tất cả ${filteredProducts.length} kết quả`;

  return (
    <div className="shop-page">
      <div className="shop-wrapper">
        <ProductFilters
          currentCategory={category}
          currentBrand={brand}
          onCategoryChange={changeCategory}
          onBrandChange={changeBrand}
        />
        <main className="shop-main">
          <div className="catalog-breadcrumb">
            <Link to="/">Trang chủ</Link> &rsaquo; <span>{categoryLabel}</span>
          </div>
          <div className="shop-toolbar">
            <div className="catalog-result-count">{resultLabel}</div>
            <ProductSearch query={query} onQueryChange={changeQuery} />
          </div>
          <ProductGrid products={items} onAdd={(product) => addProductToCart(product, 1)} />
          <CatalogPagination currentPage={page} totalPages={totalPages} onPageChange={changePage} />
        </main>
      </div>
    </div>
  );
}
