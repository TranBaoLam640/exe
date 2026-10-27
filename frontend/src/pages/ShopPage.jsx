import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CatalogPagination from '../features/catalog/components/CatalogPagination.jsx';
import ProductFilters from '../features/catalog/components/ProductFilters.jsx';
import ProductGrid from '../features/catalog/components/ProductGrid.jsx';
import ProductSearch from '../features/catalog/components/ProductSearch.jsx';
import { addProductToActiveCart } from '../features/cart/cartService.js';
import {
  fetchBrands,
  fetchCategories,
  fetchProducts,
  ITEMS_PER_PAGE,
} from '../features/catalog/services/catalogService.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { products as fallbackProducts } from '../features/catalog/data/products.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function ShopPage() {
  useDocumentTitle('Cửa Hàng | DoRentMe');

  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [inStock, setInStock] = useState(false);
  const [categories, setCategories] = useState([{ value: 'all', label: 'Tất cả' }]);
  const [brands, setBrands] = useState([{ value: 'all', label: 'Tất cả' }]);
  const [catalog, setCatalog] = useState({
    items: [],
    page: 1,
    pageSize: ITEMS_PER_PAGE,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchCategories(), fetchBrands()])
      .then(([nextCategories, nextBrands]) => {
        if (cancelled) return;
        setCategories(nextCategories);
        setBrands(nextBrands);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(getApiErrorMessage(requestError, 'Không tải được bộ lọc sản phẩm.'));
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetchProducts({
      category,
      brand,
      query,
      page,
      pageSize: ITEMS_PER_PAGE,
      sortBy,
      sortDirection,
      inStock: inStock || undefined,
    })
      .then((pageData) => {
        if (cancelled) return;
        setCatalog(pageData);
      })
      .catch((requestError) => {
        if (cancelled) return;
        const fallbackList = fallbackProducts || [];
        const start = (page - 1) * ITEMS_PER_PAGE;
        const paginated = fallbackList.slice(start, start + ITEMS_PER_PAGE);
        setCatalog({
          items: paginated,
          page,
          pageSize: ITEMS_PER_PAGE,
          totalItems: fallbackList.length,
          totalPages: Math.ceil(fallbackList.length / ITEMS_PER_PAGE),
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [brand, category, inStock, page, query, sortBy, sortDirection]);

  const categoryLabel = useMemo(
    () => categories.find((option) => option.value === category)?.label || category,
    [categories, category],
  );

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
    if (nextPage < 1 || nextPage > catalog.totalPages) return;
    setPage(nextPage);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  }

  const resultLabel = loading
    ? 'Đang tải sản phẩm...'
    : catalog.totalItems === 0
      ? 'Không có kết quả'
      : query
        ? `Tìm thấy ${catalog.totalItems} kết quả cho "${query}"`
        : `Hiển thị tất cả ${catalog.totalItems} kết quả`;

  return (
    <div className="shop-page">
      <section className="page-hero">
        <span className="page-hero-badge">✦ Bộ sưu tập thời trang</span>
        <h1>Trang Phục <span>Cho Thuê</span> Cao Cấp</h1>
        <p>Hàng trăm mẫu thiết kế dạ hội, công sở và dạo phố sẵn sàng giúp bạn tỏa sáng trong mọi khoảnh khắc.</p>
      </section>
      <div className="shop-wrapper">
        <ProductFilters
          currentCategory={category}
          currentBrand={brand}
          onCategoryChange={changeCategory}
          onBrandChange={changeBrand}
          categories={categories}
          brands={brands}
        />
        <main className="shop-main">
          <div className="catalog-breadcrumb">
            <Link to="/">Trang chủ</Link> &rsaquo; <span>{categoryLabel}</span>
          </div>
          <div className="shop-toolbar">
            <div className="catalog-result-count">{resultLabel}</div>
            <div className="catalog-toolbar-filters">
              <ProductSearch query={query} onQueryChange={changeQuery} />
              <div className="catalog-sort-controls" aria-label="Sắp xếp sản phẩm">
                <label className="catalog-sort-control">
                  <span>Sắp xếp</span>
                  <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
                    <option value="createdAt">Mới nhất</option>
                    <option value="name">Tên</option>
                    <option value="price1Day">Giá 1 ngày</option>
                  </select>
                </label>
                <label className="catalog-sort-control">
                  <span>Thứ tự</span>
                  <select value={sortDirection} onChange={(event) => { setSortDirection(event.target.value); setPage(1); }}>
                    <option value="desc">Giảm dần</option>
                    <option value="asc">Tăng dần</option>
                  </select>
                </label>
              </div>
              <label className="catalog-stock-toggle">
                <input
                  type="checkbox"
                  checked={inStock}
                  onChange={(event) => {
                    setInStock(event.target.checked);
                    setPage(1);
                  }}
                />
                <span className="catalog-stock-switch" aria-hidden="true"></span>
                <span>Còn hàng</span>
              </label>
            </div>
          </div>
          {error ? <div className="catalog-empty-state"><p>{error}</p></div> : null}
          {loading ? <div className="catalog-empty-state"><p>Đang tải sản phẩm...</p></div> : null}
          {!loading && !error ? (
            <>
              <ProductGrid products={catalog.items || []} onAdd={(product) => addProductToActiveCart(product, 1)} />
              <CatalogPagination currentPage={page} totalPages={catalog.totalPages || 0} onPageChange={changePage} />
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
}
