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
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function ShopPage() {
  useDocumentTitle('Cua Hang | DoRentMe');

  const [category, setCategory] = useState('all');
  const [brand, setBrand] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [inStock, setInStock] = useState(false);
  const [categories, setCategories] = useState([{ value: 'all', label: 'Tat ca' }]);
  const [brands, setBrands] = useState([{ value: 'all', label: 'Tat ca' }]);
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
        setError(getApiErrorMessage(requestError, 'Khong tai duoc bo loc san pham.'));
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
        setCatalog({
          items: [],
          page,
          pageSize: ITEMS_PER_PAGE,
          totalItems: 0,
          totalPages: 0,
        });
        setError(getApiErrorMessage(requestError, 'Khong tai duoc danh sach san pham.'));
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
    ? 'Dang tai san pham'
    : catalog.totalItems === 0
      ? 'Khong co ket qua'
      : query
        ? `Tim thay ${catalog.totalItems} ket qua cho "${query}"`
        : `Hien thi tat ca ${catalog.totalItems} ket qua`;

  return (
    <div className="shop-page">
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
            <Link to="/">Trang chu</Link> &rsaquo; <span>{categoryLabel}</span>
          </div>
          <div className="shop-toolbar">
            <div className="catalog-result-count">{resultLabel}</div>
            <ProductSearch query={query} onQueryChange={changeQuery} />
            <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
              <option value="createdAt">Moi nhat</option>
              <option value="name">Ten</option>
              <option value="price1Day">Gia 1 ngay</option>
            </select>
            <select value={sortDirection} onChange={(event) => { setSortDirection(event.target.value); setPage(1); }}>
              <option value="desc">Giam dan</option>
              <option value="asc">Tang dan</option>
            </select>
            <label>
              <input
                type="checkbox"
                checked={inStock}
                onChange={(event) => {
                  setInStock(event.target.checked);
                  setPage(1);
                }}
              />
              Con hang
            </label>
          </div>
          {error ? <div className="catalog-empty-state"><p>{error}</p></div> : null}
          {loading ? <div className="catalog-empty-state"><p>Dang tai san pham...</p></div> : null}
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
