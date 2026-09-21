# DoRentMe Product Display Context for ChatGPT

Generated from repository files under `D:\exe` on 2026-09-21. This file focuses on brands/products/catalog display, not deployment or AI secrets.

## Current Local Symptom

- Browser console previously showed `500 Internal Server Error` for `http://localhost:5000/api/products?...`.
- Root causes found in backend logs: local MySQL schema did not match EF model for product/shop owner columns.
- Fixed mappings added in `DoRentMeDbContext.cs`: `User.OwnedProducts`, `Category.Products`, `Shop.OwnerUserId`, and `Shop.OwnerUser` are ignored for local schema compatibility.
- Current direct API check after fix: `GET http://localhost:5000/api/products?page=1&pageSize=15` returns `200` with an empty page: `items: []`, `totalItems: 0`.
- Therefore, if the Shop page is blank now, likely the local DB has no active products matching `Products.IsActive = true` and active `Shops`, or seed data has not been loaded into the DB used by `DefaultConnection`.
- `GET /api/cart` without auth returns `401`; cart errors in browser may also come from an expired/stale `dorentme_session` token in localStorage.

## Important Local Runtime

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173` or `http://127.0.0.1:5173`
- Frontend dev proxy sends `/api/*` to backend, except local AI middleware routes.
- Backend connection string is in `backend/DoRentMe.Api/appsettings.json`; it points to MySQL on `127.0.0.1:3307`, database `dorentme`.

## Key Flow

1. `ShopPage.jsx` calls `fetchCategories()`, `fetchBrands()`, and `fetchProducts()`.
2. `catalogService.js` calls backend `/api/categories`, `/api/brands`, `/api/products`.
3. `ProductController.GetAll` calls `ProductService.GetAllAsync`.
4. `ProductService.PublicProductQuery()` filters active products with active shops and includes brand, categories, images, variants, inventory.
5. `normalizeProduct()` maps backend product shape to frontend product card shape.
6. `ProductGrid` renders `ProductCard`; product images use `imageUrl()` and `VITE_ASSET_BASE_URL`/`asset-map.json`.

## Files Included

- `frontend/src/pages/ShopPage.jsx`
- `frontend/src/pages/ProductDetailPage.jsx`
- `frontend/src/features/catalog/services/catalogService.js`
- `frontend/src/features/catalog/components/ProductGrid.jsx`
- `frontend/src/features/catalog/components/ProductCard.jsx`
- `frontend/src/features/catalog/components/ProductFilters.jsx`
- `frontend/src/features/catalog/components/ProductSearch.jsx`
- `frontend/src/features/catalog/components/ProductPrice.jsx`
- `frontend/src/features/catalog/components/CatalogPagination.jsx`
- `frontend/src/features/catalog/components/QuantitySelector.jsx`
- `frontend/src/features/catalog/data/products.js`
- `frontend/src/config/api.js`
- `frontend/src/assets/imageUrl.js`
- `frontend/src/assets/asset-map.json`
- `frontend/src/utils/assetUrl.js`
- `frontend/src/utils/apiError.js`
- `frontend/src/features/cart/cartService.js`
- `backend/DoRentMe.Api/Data/DoRentMeDbContext.cs`
- `backend/DoRentMe.Api/Controllers/ProductController.cs`
- `backend/DoRentMe.Api/Controllers/BrandController.cs`
- `backend/DoRentMe.Api/Controllers/CategoriesController.cs`
- `backend/DoRentMe.Api/Controllers/ShopController.cs`
- `backend/DoRentMe.Api/Services/ProductService.cs`
- `backend/DoRentMe.Api/Services/BrandService.cs`
- `backend/DoRentMe.Api/Services/CategoryService.cs`
- `backend/DoRentMe.Api/Services/ShopService.cs`
- `backend/DoRentMe.Api/Services/InventoryService.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductQueryRequest.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductResponse.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductImageResponse.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductCategoryResponse.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductCreateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductUpdateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductVariantResponse.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductVariantCreateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Product/ProductVariantUpdateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Brand/BrandResponses.cs`
- `backend/DoRentMe.Api/Contracts/Brand/BrandReadResponses.cs`
- `backend/DoRentMe.Api/Contracts/Brand/BrandRequests.cs`
- `backend/DoRentMe.Api/Contracts/Brand/BrandUpdateRequests.cs`
- `backend/DoRentMe.Api/Contracts/Category/CategoryReadResponse.cs`
- `backend/DoRentMe.Api/Contracts/Category/CategoryResponses.cs`
- `backend/DoRentMe.Api/Contracts/Category/CategoryCreateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Category/CategoryUpdateRequest.cs`
- `backend/DoRentMe.Api/Contracts/Shop/ShopReadResponse.cs`
- `backend/DoRentMe.Api/Contracts/Common/PagedResponse.cs`
- `backend/DoRentMe.Api/Contracts/Inventory/ProductAvailabilityResponse.cs`
- `backend/DoRentMe.Api/Contracts/Inventory/ProductVariantAvailabilityResponse.cs`
- `backend/DoRentMe.Api/Models/Product.cs`
- `backend/DoRentMe.Api/Models/ProductImage.cs`
- `backend/DoRentMe.Api/Models/ProductVariant.cs`
- `backend/DoRentMe.Api/Models/ProductInventoryItem.cs`
- `backend/DoRentMe.Api/Models/ProductCategory.cs`
- `backend/DoRentMe.Api/Models/Brand.cs`
- `backend/DoRentMe.Api/Models/Category.cs`
- `backend/DoRentMe.Api/Models/Shop.cs`
- `backend/DoRentMe.Api/Models/User.cs`
- `database/schema.sql`
- `database/seed-legacy-catalog.mysql.sql`
- `tools/catalog/generate-legacy-catalog-seed.js`
- `tools/catalog/README.md`
- `frontend/scripts/validate-catalog.js`
- `frontend/scripts/check-cutover-readiness.js`

## `frontend/src/pages/ShopPage.jsx`

```jsx
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
            <div className="catalog-sort-controls" aria-label="Sap xep san pham">
              <label className="catalog-sort-control">
                <span>Sap xep</span>
                <select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setPage(1); }}>
                  <option value="createdAt">Moi nhat</option>
                  <option value="name">Ten</option>
                  <option value="price1Day">Gia 1 ngay</option>
                </select>
              </label>
              <label className="catalog-sort-control">
                <span>Thu tu</span>
                <select value={sortDirection} onChange={(event) => { setSortDirection(event.target.value); setPage(1); }}>
                  <option value="desc">Giam dan</option>
                  <option value="asc">Tang dan</option>
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
              <span>Con hang</span>
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
```

## `frontend/src/pages/ProductDetailPage.jsx`

```jsx
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { addProductToActiveCart } from '../features/cart/cartService.js';
import { buildTryOnProductUrl, legacyProductFromParams } from '../features/ai/tryon/tryOnProduct.js';
import ProductPrice from '../features/catalog/components/ProductPrice.jsx';
import QuantitySelector from '../features/catalog/components/QuantitySelector.jsx';
import {
  favoriteProduct,
  fetchProductById,
  getFallbackProduct,
  unfavoriteProduct,
} from '../features/catalog/services/catalogService.js';
import { useAuthState } from '../features/auth/useAuthState.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const session = useAuthState();
  const fallbackProduct = useMemo(() => getFallbackProduct(), []);
  const [product, setProduct] = useState(fallbackProduct);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favoriteError, setFavoriteError] = useState('');

  useDocumentTitle(`${product.name} | DoRentMe`);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    if (!id) {
      const legacyProduct = legacyProductFromParams(searchParams);
      setProduct(legacyProduct ? { ...fallbackProduct, ...legacyProduct } : fallbackProduct);
      setLoading(false);
      return () => {
        cancelled = true;
      };
    }

    fetchProductById(id)
      .then((nextProduct) => {
        if (cancelled) return;
        setProduct(nextProduct);
      })
      .catch((requestError) => {
        if (cancelled) return;
        setError(getApiErrorMessage(requestError, 'Khong tai duoc san pham.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackProduct, id, searchParams]);

  const stars = useMemo(() => {
    const count = Math.round(product.rating || 5);
    return '*'.repeat(count) + '-'.repeat(5 - count);
  }, [product.rating]);

  async function addToCart() {
    await addProductToActiveCart(product, quantity);
  }

  async function rentNow() {
    await addToCart();
    window.location.href = '/cart';
  }

  async function toggleFavorite() {
    if (!session?.token) {
      setFavoriteError('Vui long dang nhap de yeu thich san pham.');
      return;
    }

    setFavoriteError('');
    try {
      const nextProduct = product.isFavorited
        ? await unfavoriteProduct(product.id)
        : await favoriteProduct(product.id);
      setProduct(nextProduct);
    } catch (requestError) {
      setFavoriteError(getApiErrorMessage(requestError, 'Khong cap nhat duoc yeu thich.'));
    }
  }

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-wrapper">
          <div className="catalog-empty-state"><p>Dang tai san pham...</p></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-page">
        <div className="product-detail-wrapper">
          <div className="catalog-empty-state"><p>{error}</p></div>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-wrapper">
        <div className="product-breadcrumb">
          <Link to="/">Trang chu</Link>
          <span className="sep">&rsaquo;</span>
          <Link to="/shop">{product.categoryLabel || 'San pham'}</Link>
          <span className="sep">&rsaquo;</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail">
          <div className="product-left">
            <div className="product-main-image">
              <img src={imageUrl(product.image)} alt={product.name} />
            </div>
            <div className="product-image-actions">
              <button
                className={`product-like-btn ${product.isFavorited ? 'liked' : ''}`}
                type="button"
                onClick={toggleFavorite}
              >
                <span className="heart">{product.isFavorited ? 'liked' : 'like'}</span>
                <span>{product.isFavorited ? 'Da thich' : 'Yeu thich'}</span>
                <strong>{product.likeCount || 0}</strong>
              </button>
              <div className="product-share-btns">
                <a href="#" className="product-share-btn zalo" title="Chia se Zalo">Z</a>
                <a href="#" className="product-share-btn fb" title="Chia se Facebook">f</a>
              </div>
            </div>
            {favoriteError ? <div className="catalog-empty-state"><p>{favoriteError}</p></div> : null}
          </div>

          <div className="product-right">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-meta">
              <div className="product-rating">
                <span className="product-stars">{stars}</span>
                <span className="product-rating-num">{Number(product.rating || 5).toFixed(1)}</span>
              </div>
              <span className="divider-dot">/</span>
              <span className="product-review-count"><strong>{product.reviews || 0}</strong> danh gia</span>
              <span className="divider-dot">/</span>
              <span className="product-like-count">
                <span className="heart">like</span>
                <strong>{product.likeCount || 0}</strong> luot thich
              </span>
            </div>

            <ProductPrice product={product} variant="detail" />
            <hr className="product-info-divider" />

            <div className="product-info-row">
              <span className="product-info-row-label">Ton kho</span>
              <div className="product-info-row-content">
                {product.availableStock || 0} san pham kha dung
              </div>
            </div>

            <hr className="product-info-divider" />
            <div className="product-info-row">
              <span className="product-info-row-label">Bien the</span>
              <div className="product-info-row-content">
                {(product.variants || []).map((variant) => (
                  <span className="product-discount-chip" key={variant.id}>
                    {variant.size} / {variant.color} / {variant.availableStock} con
                  </span>
                ))}
              </div>
            </div>

            <hr className="product-info-divider" />
            <div className="product-info-row align-center">
              <span className="product-info-row-label">So luong</span>
              <div className="product-info-row-content">
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>
            </div>

            <div className="product-action-btns">
              <button className="product-btn-cart" type="button" onClick={addToCart}>Them vao gio</button>
              <button className="product-btn-rent-now" type="button" onClick={rentNow}>Thue ngay</button>
            </div>
            <Link to={buildTryOnProductUrl(product)} className="product-btn-tryon">Thu do AI voi san pham nay</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## `frontend/src/features/catalog/services/catalogService.js`

```js
import api from '../../../config/api.js';
import { formatVnd } from '../../cart/cartService.js';

export const ITEMS_PER_PAGE = 15;

const fallbackImage = 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg';

export const categoryOptions = [
  { value: 'all', label: 'Tat ca' },
];

export const brandOptions = [
  { value: 'all', label: 'Tat ca' },
];

export function normalizeProduct(apiProduct = {}) {
  const primaryImage = apiProduct.primaryImage || apiProduct.images?.[0];
  const category = apiProduct.categories?.[0];
  const price1Day = Number(apiProduct.price1Day) || 0;
  const price3Day = Number(apiProduct.price3Day) || 0;
  const extraDayPrice = Number(apiProduct.extraDayPrice) || 0;
  const priceDeposit = Number(apiProduct.priceDeposit) || 0;

  return {
    ...apiProduct,
    image: primaryImage?.imageUrl || fallbackImage,
    category: category?.slug || '',
    categoryLabel: category?.name || '',
    brand: apiProduct.brandName || '',
    likes: apiProduct.likeCount || 0,
    rating: apiProduct.rating || 5,
    reviews: apiProduct.reviews || 0,
    price1day: formatVnd(price1Day),
    price3day: formatVnd(price3Day),
    priceTag: apiProduct.priceTag ? formatVnd(Number(apiProduct.priceTag)) : '',
    priceDeposit: formatVnd(priceDeposit),
    priceExtra: `Them ngay: ${formatVnd(extraDayPrice)}/ngay`,
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
    { value: 'all', label: 'Tat ca' },
    ...(response.data?.data || []).map((category) => ({
      value: String(category.id),
      label: category.name,
      slug: category.slug,
    })),
  ];
}

export async function fetchBrands() {
  const response = await api.get('/api/brands');
  return [
    { value: 'all', label: 'Tat ca' },
    ...(response.data?.data || []).map((brand) => ({
      value: String(brand.id),
      label: brand.name,
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
```

## `frontend/src/features/catalog/components/ProductGrid.jsx`

```jsx
import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, onAdd }) {
  return (
    <div className="catalog-product-grid">
      {products.map((product) => <ProductCard product={product} onAdd={onAdd} key={product.id} />)}
      {products.length === 0 ? (
        <div className="catalog-empty-state">
          <div className="catalog-empty-icon">寫・・/div>
          <p>Khﾃｴng cﾃｳ s蘯｣n ph蘯ｩm nﾃo trong danh m盻･c nﾃy.</p>
        </div>
      ) : null}
    </div>
  );
}
```

## `frontend/src/features/catalog/components/ProductCard.jsx`

```jsx
import { Link } from 'react-router-dom';
import { imageUrl } from '../../../assets/imageUrl.js';
import ProductPrice from './ProductPrice.jsx';

export default function ProductCard({ product, variant = 'shop', onAdd }) {
  if (variant === 'home') {
    return (
      <article className="catalog-product-card catalog-product-card--home">
        <span className="catalog-card-badge">new</span>
        <img className="catalog-product-img" src={imageUrl(product.image)} alt={product.name} />
        <div className="catalog-product-info">
          <div className="catalog-product-name">{product.name}</div>
          <ProductPrice product={product} variant="home" />
          <Link to="/shop" className="catalog-btn-rent">Xem thﾃｪm</Link>
        </div>
      </article>
    );
  }

  return (
    <Link className="catalog-product-card catalog-product-card--shop" to={`/product/${product.id}`}>
      <img src={imageUrl(product.image)} alt={product.name} />
      <div className="catalog-card-info">
        <div className="catalog-card-name">{product.name}</div>
        <ProductPrice product={product} />
        <button
          className="catalog-card-add"
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onAdd?.(product);
          }}
        >
          將 Thﾃｪm vﾃo gi盻・        </button>
      </div>
    </Link>
  );
}
```

## `frontend/src/features/catalog/components/ProductFilters.jsx`

```jsx
import { brandOptions as fallbackBrandOptions, categoryOptions as fallbackCategoryOptions } from '../services/catalogService.js';

export default function ProductFilters({
  currentCategory,
  currentBrand,
  onCategoryChange,
  onBrandChange,
  categories = fallbackCategoryOptions,
  brands = fallbackBrandOptions,
}) {
  return (
    <aside className="catalog-sidebar">
      <div className="catalog-sidebar-section">
        <div className="catalog-sidebar-title">Danh m盻･c s蘯｣n ph蘯ｩm</div>
        {categories.map((option) => (
          <button
            className={`catalog-sidebar-link ${currentCategory === option.value ? 'active' : ''}`}
            type="button"
            onClick={() => onCategoryChange(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="catalog-sidebar-section">
        <div className="catalog-sidebar-title">Thﾆｰﾆ｡ng hi盻㎡</div>
        {brands.map((option) => (
          <button
            className={`catalog-brand-link ${currentBrand === option.value ? 'active' : ''}`}
            type="button"
            onClick={() => onBrandChange(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
    </aside>
  );
}
```

## `frontend/src/features/catalog/components/ProductSearch.jsx`

```jsx
export default function ProductSearch({ query, onQueryChange }) {
  return (
    <div className="catalog-search-box">
      <input
        type="text"
        value={query}
        placeholder="Tﾃｬm theo tﾃｪn b盻・vﾃ｡y..."
        onChange={(event) => onQueryChange(event.target.value)}
      />
      <button type="button" onClick={() => onQueryChange(query)}>剥</button>
    </div>
  );
}
```

## `frontend/src/features/catalog/components/ProductPrice.jsx`

```jsx
export default function ProductPrice({ product, variant = 'card' }) {
  if (variant === 'detail') {
    return (
      <div className="catalog-price-box">
        <div className="catalog-price-row">
          <span className="catalog-price-label">Giﾃ｡ thuﾃｪ 3 ngﾃy:</span>
          <span className="catalog-price-value">{product.price3day}</span>
        </div>
        <div className="catalog-price-note">{product.priceExtra}</div>
        <div className="catalog-price-row secondary">
          <span className="catalog-price-label">Giﾃ｡ thuﾃｪ 1 ngﾃy:</span>
          <span className="catalog-price-value">{product.price1day}</span>
        </div>
        <div className="catalog-price-row tag">
          <span className="catalog-price-label">Giﾃ｡ tag:</span>
          <span className="catalog-price-value">{product.priceTag}</span>
        </div>
        <div className="catalog-price-row deposit">
          <span className="catalog-price-label">Giﾃ｡ c盻皇:</span>
          <span className="catalog-price-value">{product.priceDeposit}</span>
        </div>
      </div>
    );
  }

  if (variant === 'home') {
    return (
      <ul className="catalog-price-list">
        <li className="highlight">Giﾃ｡ thuﾃｪ 3 ngﾃy: {product.price3day}</li>
        <li className="muted">{product.priceExtra}</li>
        <li>Giﾃ｡ thuﾃｪ 1 ngﾃy: {product.price1day}</li>
        <li>Giﾃ｡ tag: {product.priceTag}</li>
        <li>Giﾃ｡ c盻皇: {product.priceDeposit}</li>
      </ul>
    );
  }

  return (
    <div className="catalog-card-price">
      Giﾃ｡ thuﾃｪ 3 ngﾃy: <strong>{product.price3day}</strong><br />
      <span className="extra">{product.priceExtra}</span><br />
      Giﾃ｡ thuﾃｪ 1 ngﾃy: <strong>{product.price1day}</strong><br />
      <span className="red">Giﾃ｡ tag: {product.priceTag}</span><br />
      <span className="red">Giﾃ｡ c盻皇: {product.priceDeposit}</span>
    </div>
  );
}
```

## `frontend/src/features/catalog/components/CatalogPagination.jsx`

```jsx
export default function CatalogPagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  return (
    <div className="catalog-pagination">
      {Array.from({ length: totalPages }, (_, index) => {
        const page = index + 1;
        return (
          <button
            className={`catalog-page-btn ${page === currentPage ? 'active' : ''}`}
            type="button"
            onClick={() => onPageChange(page)}
            key={page}
          >
            {page}
          </button>
        );
      })}
      {currentPage < totalPages ? (
        <button className="catalog-page-btn arrow" type="button" onClick={() => onPageChange(currentPage + 1)}>
          竊・        </button>
      ) : null}
    </div>
  );
}
```

## `frontend/src/features/catalog/components/QuantitySelector.jsx`

```jsx
export default function QuantitySelector({ value, onChange }) {
  function changeBy(delta) {
    onChange(Math.min(10, Math.max(1, value + delta)));
  }

  return (
    <div className="catalog-qty-selector">
      <button className="catalog-qty-btn" type="button" onClick={() => changeBy(-1)}>竏・/button>
      <input className="catalog-qty-input" type="text" value={value} readOnly />
      <button className="catalog-qty-btn" type="button" onClick={() => changeBy(1)}>+</button>
    </div>
  );
}
```

## `frontend/src/features/catalog/data/products.js`

```js
export const legacyProducts = [
    // ── Áo dài ──
    { name: 'FLANE – UYỂN KHANH',       image: 'image/ao_dai/flane_uyenkhanh.jpg',        category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'FLANE',          price3day: '300.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '260.000 vnd', priceTag: '1.900.000 vnd', priceDeposit: '1.200.000 vnd', rating: 4.8, reviews: 42,  likes: 87 },
    { name: 'LINN DESIGN – TUỆ HIỀN',   image: 'image/ao_dai/linn_design_tue_hien.jpg',   category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'Khác',           price3day: '340.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '295.000 vnd', priceTag: '1.590.000 vnd', priceDeposit: '1.200.000 vnd', rating: 4.9, reviews: 38,  likes: 74 },
    { name: 'MAINICHI – MỘC MIÊN',      image: 'image/ao_dai/mainichi_moc_mien.png',      category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'Mainichi',       price3day: '260.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '220.000 vnd', priceTag: '1.200.000 vnd', priceDeposit: '800.000 vnd',   rating: 4.7, reviews: 31,  likes: 65 },
    { name: 'MAINICHI – YÊN CHI',       image: 'image/ao_dai/mainichi_yen_chi.jpg',       category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'Mainichi',       price3day: '290.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '250.000 vnd', priceTag: '1.550.000 vnd', priceDeposit: '900.000 vnd',   rating: 4.8, reviews: 55,  likes: 102 },
    { name: 'MAISON LONG – NIỀM NỖI',   image: 'image/ao_dai/maison_long_niem_no.jpg',    category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'MAISON LONG',    price3day: '220.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '180.000 vnd', priceTag: '1.150.000 vnd', priceDeposit: '700.000 vnd',   rating: 4.6, reviews: 28,  likes: 59 },
    { name: 'D.CHIC NÀNG THƠ PHỐ HỘI',  image: 'image/ao_dai/dchic-nang-tho-pho-hoi.jpg', category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'D.CHIC',         price3day: '320.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '280.000 vnd', priceTag: '1.950.000 vnd', priceDeposit: '1.200.000 vnd', rating: 4.9, reviews: 67,  likes: 134 },
    { name: 'D.CHIC COUTURE',            image: 'image/ao_dai/dchic_couture.jpg',           category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'D.CHIC',         price3day: '500.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '450.000 vnd', priceTag: '3.500.000 vnd', priceDeposit: '2.000.000 vnd', rating: 5.0, reviews: 89,  likes: 178 },
    { name: 'D.CHIC XUÂN VIÊN',          image: 'image/ao_dai/d.chic_xuan_vien.jpg',        category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'D.CHIC',         price3day: '480.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '440.000 vnd', priceTag: '2.850.000 vnd', priceDeposit: '2.000.000 vnd', rating: 4.9, reviews: 73,  likes: 156 },
    { name: 'D.CHIC Ý NHIÊN',            image: 'image/ao_dai/dchic_y_nhien.jpg',           category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'D.CHIC',         price3day: '490.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '450.000 vnd', priceTag: '2.950.000 vnd', priceDeposit: '2.000.000 vnd', rating: 4.8, reviews: 61,  likes: 120 },
    { name: 'D.CHIC THIÊN Ý',            image: 'image/ao_dai/d_chic_thien_y.jpg',          category: 'ao-dai', categoryLabel: 'Áo dài',      brand: 'D.CHIC',         price3day: '450.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '410.000 vnd', priceTag: '2.600.000 vnd', priceDeposit: '1.900.000 vnd', rating: 4.7, reviews: 44,  likes: 93 },
    // ── Váy đi biển ──
    { name: 'TIPBLU – ĐẦM VOAN TÍM LAVENDER',          image: 'image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg',       category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'Khác',        price3day: '190.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '160.000 vnd', priceTag: '930.000 vnd',   priceDeposit: '650.000 vnd', rating: 4.7, reviews: 38, likes: 76 },
    { name: 'CHOUCHOU – ĐẦM REN NUDE DÁNG DÀI',        image: 'image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg',    category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'CHOUCHOU',    price3day: '255.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '225.000 vnd', priceTag: '1.110.000 vnd', priceDeposit: '800.000 vnd', rating: 4.8, reviews: 51, likes: 95 },
    { name: 'AMELIE – VANESSA DRESS XANH NHẠT',         image: 'image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg',     category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'AMELIEE',     price3day: '290.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '250.000 vnd', priceTag: '1.530.000 vnd', priceDeposit: '900.000 vnd', rating: 4.9, reviews: 64, likes: 118 },
    { name: 'JOLIE LOFT – VÁY LƯỚI MOLLY DRESS NÂU',   image: 'image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg', category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'JOLIE LOFT',  price3day: '270.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '230.000 vnd', priceTag: '2.150.000 vnd', priceDeposit: '800.000 vnd', rating: 4.8, reviews: 47, likes: 89 },
    { name: 'FLANE – REN CỔ YẾM',                       image: 'image/vay_di_bien/flane_ren_co_yem.jpg',                   category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'FLANE',       price3day: '240.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '200.000 vnd', priceTag: '1.080.000 vnd', priceDeposit: '800.000 vnd', rating: 4.7, reviews: 33, likes: 67 },
    { name: 'JOLIE LOFT – LỤA',                          image: 'image/vay_di_bien/jolie_loft_lua.jpg',                     category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'JOLIE LOFT',  price3day: '195.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '165.000 vnd', priceTag: '1.320.000 vnd', priceDeposit: '700.000 vnd', rating: 4.8, reviews: 55, likes: 102 },
    { name: 'JOLIE LOFT – VÁY REN CÓ TAY',              image: 'image/vay_di_bien/jolie_loft_vay_ren_co_tay.jpg',          category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'JOLIE LOFT',  price3day: '220.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '190.000 vnd', priceTag: '1.812.000 vnd', priceDeposit: '700.000 vnd', rating: 4.6, reviews: 29, likes: 58 },
    { name: 'FLANE – REN BỒ MÙI TRẺ VAI',               image: 'image/vay_di_bien/flane_ren_bo_mui_tre_vai.jpg',           category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'FLANE',       price3day: '195.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '165.000 vnd', priceTag: '1.006.500 vnd', priceDeposit: '700.000 vnd', rating: 4.7, reviews: 41, likes: 83 },
    { name: 'AMELIE – VÁY BÍ BABYDOLL CỔ YẾM',          image: 'image/vay_di_bien/amelie_vay_bi_babydoll_co_yem.jpg',      category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'AMELIEE',     price3day: '170.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '140.000 vnd', priceTag: '870.000 vnd',   priceDeposit: '600.000 vnd', rating: 4.6, reviews: 26, likes: 54 },
    { name: 'VÁY REN PHỐI TƠ',                           image: 'image/vay_di_bien/vay_ren_phoi_to.jpg',                    category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'Khác',        price3day: '130.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '100.000 vnd', priceTag: '680.000 vnd',   priceDeposit: '400.000 vnd', rating: 4.5, reviews: 19, likes: 43 },
    { name: 'AMELIEE – GARMENT',                          image: 'image/vay_di_bien/ameliee_garment.jpg',                    category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'AMELIEE',     price3day: '175.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '140.000 vnd', priceTag: '888.000 vnd',   priceDeposit: '700.000 vnd', rating: 4.7, reviews: 35, likes: 71 },
    { name: 'AMELIEE – DIVA',                             image: 'image/vay_di_bien/ameliee_diva.webp',                      category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'AMELIEE',     price3day: '190.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '150.000 vnd', priceTag: '960.000 vnd',   priceDeposit: '700.000 vnd', rating: 4.8, reviews: 48, likes: 92 },
    { name: 'MAISON LONG – THỦY MỊ',                     image: 'image/vay_di_bien/maison_long_thuy_mi.jpg',                category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'MAISON LONG', price3day: '230.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '190.000 vnd', priceTag: '1.250.000 vnd', priceDeposit: '750.000 vnd', rating: 4.9, reviews: 57, likes: 109 },
    { name: 'VÁY HOA MÙA HÈ',                            image: 'image/vay_di_bien/vay_hoa_mua_he.jpg',                     category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'Khác',        price3day: '120.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '90.000 vnd',  priceTag: '594.000 vnd',   priceDeposit: '300.000 vnd', rating: 4.5, reviews: 22, likes: 47 },
    { name: 'SET VÁY 2 DÂY + CHÂN VÁY TRẮNG KEM LANNIE', image: 'image/vay_di_bien/set_vay_2_day_chan_vay_trang_kem_lannie.jpg', category: 'vay-di-bien', categoryLabel: 'Váy đi biển', brand: 'Khác', price3day: '120.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '100.000 vnd', priceTag: '650.000 vnd', priceDeposit: '400.000 vnd', rating: 4.6, reviews: 31, likes: 63 },
    // ── Váy dự tiệc ──
    { name: 'SÒ VINTAGE – NATHALIA',                image: 'image/vay_du_tiec/so_vintage_nathalia.jpg',                category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '560.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '490.000 vnd', priceTag: '3.620.000 vnd', priceDeposit: '2.000.000 vnd', rating: 5.0, reviews: 120, likes: 203 },
    { name: 'TIPBLU – ĐẦM VOAN TÍM LAVENDER',       image: 'image/vay_du_tiec/tipblu_dam_voan_tim_lavender.jpg',       category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'Khác',           price3day: '190.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '160.000 vnd', priceTag: '930.000 vnd',   priceDeposit: '650.000 vnd',   rating: 4.7, reviews: 38,  likes: 76 },
    { name: 'JOLIE LOFT – ĐẦM LỤA KEM HALI DRESS',  image: 'image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg',  category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'JOLIE LOFT',     price3day: '200.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '175.000 vnd', priceTag: '1.600.000 vnd', priceDeposit: '600.000 vnd',   rating: 4.9, reviews: 86,  likes: 128 },
    { name: 'CHOUCHOU – ĐẦM REN NUDE DÁNG DÀI',     image: 'image/vay_du_tiec/chouchou_dam_ren_nude_dang_dai.jpg',     category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'CHOUCHOU',       price3day: '255.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '225.000 vnd', priceTag: '1.110.000 vnd', priceDeposit: '800.000 vnd',   rating: 4.8, reviews: 51,  likes: 95 },
    { name: 'AMELIE – VANESSA DRESS XANH NHẠT',      image: 'image/vay_du_tiec/amelie_vanessa_dress_xanh_nhat.jpg',     category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'AMELIEE',        price3day: '290.000 vnd', priceExtra: '(Trên 3 ngày +40.000 vnd/ngày)', price1day: '250.000 vnd', priceTag: '1.530.000 vnd', priceDeposit: '900.000 vnd',   rating: 4.9, reviews: 64,  likes: 118 },
    { name: 'JOLIE LOFT – VÁY LƯỚI MOLLY DRESS NÂU', image: 'image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg', category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'JOLIE LOFT',   price3day: '270.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '230.000 vnd', priceTag: '2.150.000 vnd', priceDeposit: '800.000 vnd',   rating: 4.8, reviews: 47,  likes: 89 },
    { name: 'SÒ VINTAGE – LYRA',                     image: 'image/vay_du_tiec/so_vintage_lyra.jpg',                    category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '420.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '388.000 vnd', priceTag: '2.388.000 vnd', priceDeposit: '1.500.000 vnd', rating: 4.8, reviews: 59,  likes: 113 },
    { name: 'WONDER HOUSE – LUA DRESS KEM',          image: 'image/vay_du_tiec/wonder_house_lua_dress_kem.jpg',          category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'Khác',           price3day: '190.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '165.000 vnd', priceTag: '795.000 vnd',   priceDeposit: '500.000 vnd',   rating: 4.6, reviews: 33,  likes: 67 },
    { name: 'SÒ VINTAGE – VELIA (ĐEN)',              image: 'image/vay_du_tiec/so_vintage_velia(den).jpg',              category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '440.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '390.000 vnd', priceTag: '2.590.000 vnd', priceDeposit: '1.500.000 vnd', rating: 4.9, reviews: 71,  likes: 139 },
    { name: 'SÒ VINTAGE – VELIANA (ĐEN)',            image: 'image/vay_du_tiec/so_vintage_veliana(den).jpg',            category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '340.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '290.000 vnd', priceTag: '1.969.000 vnd', priceDeposit: '1.300.000 vnd', rating: 4.7, reviews: 44,  likes: 88 },
    { name: 'CHOUCHOU – ĐẦM DÀI REN CHOÀNG',        image: 'image/vay_du_tiec/chouchou_dam_dai_ren_choang.jpg',         category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'CHOUCHOU',       price3day: '230.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '200.000 vnd', priceTag: '990.000 vnd',   priceDeposit: '700.000 vnd',   rating: 4.7, reviews: 36,  likes: 72 },
    { name: 'SÒ VINTAGE – VELIA',                    image: 'image/vay_du_tiec/so_vintage_velia.jpg',                   category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '440.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '390.000 vnd', priceTag: '2.590.000 vnd', priceDeposit: '1.500.000 vnd', rating: 4.9, reviews: 68,  likes: 132 },
    { name: 'SÒ VINTAGE – LAFINE',                   image: 'image/vay_du_tiec/so_vintage_lafine.jpg',                  category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '450.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '400.000 vnd', priceTag: '2.629.000 vnd', priceDeposit: '1.500.000 vnd', rating: 4.8, reviews: 55,  likes: 107 },
    { name: 'SÒ VINTAGE – VELIANA',                  image: 'image/vay_du_tiec/so_vintage_veliana.png',                 category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'SÒ VINTAGE',     price3day: '340.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '290.000 vnd', priceTag: '1.969.000 vnd', priceDeposit: '1.300.000 vnd', rating: 4.7, reviews: 41,  likes: 82 },
    { name: 'JOLIE LOFT – VÁY LỤA LUALA DRESS',     image: 'image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png',     category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'JOLIE LOFT',     price3day: '240.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '210.000 vnd', priceTag: '1.890.000 vnd', priceDeposit: '800.000 vnd',   rating: 4.8, reviews: 62,  likes: 119 },
    { name: 'HƯƠNG BOUTIQUE – LOUISE LACE DRESS',    image: 'image/vay_du_tiec/huong_boutique_louise_lace_dress.jpg',   category: 'vay-du-tiec', categoryLabel: 'Váy dự tiệc', brand: 'HƯƠNG BOUTIQUE', price3day: '420.000 vnd', priceExtra: '(Trên 3 ngày +50.000 vnd/ngày)', price1day: '380.000 vnd', priceTag: '2.050.000 vnd', priceDeposit: '1.400.000 vnd', rating: 4.9, reviews: 77,  likes: 145 },
    // ── Phụ kiện ──
    { name: 'TÚI NHUNG ĐEN D.CHIC',                                      image: 'image/phu_kien/tui_nhung_den_dchic.jpg',       category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'D.CHIC',  price3day: '80.000 vnd',  priceExtra: '(Trên 3 ngày +20.000 vnd/ngày)', price1day: '60.000 vnd',  priceTag: '980.000 vnd',  priceDeposit: '300.000 vnd', rating: 4.7, reviews: 28, likes: 54 },
    { name: 'TÚI DA ĐEN MYS.P',                                           image: 'image/phu_kien/tui_da_den_mysp.jpg',           category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'Mys.P',   price3day: '90.000 vnd',  priceExtra: '(Trên 3 ngày +20.000 vnd/ngày)', price1day: '70.000 vnd',  priceTag: '590.000 vnd',  priceDeposit: '400.000 vnd', rating: 4.6, reviews: 19, likes: 41 },
    { name: 'TÚI DA ĐỎ',                                                  image: 'image/phu_kien/tui_da_do.jpg',                 category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'Khác',    price3day: '70.000 vnd',  priceExtra: '(Trên 3 ngày +10.000 vnd/ngày)', price1day: '50.000 vnd',  priceTag: '',             priceDeposit: '300.000 vnd', rating: 4.5, reviews: 14, likes: 29 },
    { name: 'TÚI TRỨNG NGỌC TRAI',                                        image: 'image/phu_kien/tui_trung_ngoc_trai.jpg',       category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'Khác',    price3day: '120.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '100.000 vnd', priceTag: '',             priceDeposit: '400.000 vnd', rating: 4.8, reviews: 33, likes: 67 },
    { name: 'COMBO PHỤ KIỆN ÁO DÀI (VÒNG + BỜM + TÚI)',                  image: 'image/phu_kien/com_bo_phu_kien_ao_dai.jpg',    category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'CHIRON',  price3day: '100.000 vnd', priceExtra: '(Trên 3 ngày +20.000 vnd/ngày)', price1day: '80.000 vnd',  priceTag: '',             priceDeposit: '300.000 vnd', rating: 4.8, reviews: 41, likes: 78 },
    { name: 'COMBO NGỌC TRAI (TÚI + VÒNG CỔ, TÚI + BỜM/VÒNG TAY)',      image: 'image/phu_kien/combo_ngoc_trai.jpg',           category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'CHIRON',  price3day: '100.000 vnd', priceExtra: '(Trên 3 ngày +20.000 vnd/ngày)', price1day: '80.000 vnd',  priceTag: '',             priceDeposit: '300.000 vnd', rating: 4.7, reviews: 36, likes: 71 },
    { name: 'TÚI MŨ ĐI BIỂN',                                             image: 'image/phu_kien/tui_mu_di_bien.jpg',            category: 'phu-kien', categoryLabel: 'Phụ kiện', brand: 'Khác',    price3day: '100.000 vnd', priceExtra: '(Trên 3 ngày +20.000 vnd/ngày)', price1day: '80.000 vnd',  priceTag: '500.000 vnd',  priceDeposit: '400.000 vnd', rating: 4.6, reviews: 22, likes: 46 },
    // ── Váy lụa ──
    { name: 'JOLIE LOFT – ĐẦM LỤA KEM HALI DRESS', image: 'image/vay_lua/jolie_loft_dam_lua_kem_hali_dress.jpg', category: 'vay-lua', categoryLabel: 'Váy lụa', brand: 'JOLIE LOFT', price3day: '200.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '175.000 vnd', priceTag: '1.600.000 vnd', priceDeposit: '600.000 vnd', rating: 4.9, reviews: 86, likes: 128 },
    { name: 'WONDER HOUSE – LUA DRESS KEM',          image: 'image/vay_lua/wonder_house_lua_dress_kem.jpg',        category: 'vay-lua', categoryLabel: 'Váy lụa', brand: 'Khác',       price3day: '190.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '165.000 vnd', priceTag: '795.000 vnd',   priceDeposit: '500.000 vnd', rating: 4.6, reviews: 33, likes: 67 },
    { name: 'JOLIE LOFT – VÁY LỤA LUALA DRESS',     image: 'image/vay_lua/jolie_loft_vaylua_dress.png',           category: 'vay-lua', categoryLabel: 'Váy lụa', brand: 'JOLIE LOFT', price3day: '240.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '210.000 vnd', priceTag: '1.890.000 vnd', priceDeposit: '800.000 vnd', rating: 4.8, reviews: 62, likes: 119 },
    { name: 'JOLIE LOFT – LỤA',                      image: 'image/vay_lua/jolie_loft_lua.jpg',                    category: 'vay-lua', categoryLabel: 'Váy lụa', brand: 'JOLIE LOFT', price3day: '195.000 vnd', priceExtra: '(Trên 3 ngày +30.000 vnd/ngày)', price1day: '165.000 vnd', priceTag: '1.320.000 vnd', priceDeposit: '700.000 vnd', rating: 4.8, reviews: 55, likes: 102 }
];
export function productIdentitySource(product) {
  return `${product.category}|${product.image}`;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'product';
}

function fnv1a(value) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(36);
}

export function deriveProductId(product) {
  const source = productIdentitySource(product);
  const baseName = String(product.image || product.name || 'product').split('/').pop().replace(/\.[^.]+$/, '');
  return `${slugify(product.category)}-${slugify(baseName)}-${fnv1a(source)}`;
}

export const products = legacyProducts.map((product) => ({
  ...product,
  id: deriveProductId(product),
}));
```

## `frontend/src/config/api.js`

```js
import axios from "axios";
import { readJsonValue } from "../utils/browserStorage.js";

const api = axios.create({
    baseURL: import.meta.env?.VITE_API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const session = readJsonValue(
        typeof window !== "undefined" ? window.localStorage : null,
        "dorentme_session",
        null,
    );

    if (session?.token) {
        config.headers.Authorization = `Bearer ${session.token}`;
    }

    return config;
});

export default api;
```

## `frontend/src/assets/imageUrl.js`

```js
import assetMap from './asset-map.json';
import { assetUrl } from '../utils/assetUrl';

export function imageUrl(sourcePath) {
  const key = assetMap[String(sourcePath || '').replace(/^\/+/, '')];
  return assetUrl(key || sourcePath);
}
```

## `frontend/src/assets/asset-map.json`

```json
{
  "amelie-vanessa-dress-xanh-nhat.jpg": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
  "anh_chan_dung_gai.jpg": "team/anh-chan-dung-gai-663916e23921.jpg",
  "anh_chan_dung.jpg": "team/anh-chan-dung-8242e5e0e807.jpg",
  "chouchou-dam-ren-nude-dang-dai.jpg": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
  "con_cho_ngu_dan.jpg": "team/con-cho-ngu-dan-6370468044af.jpg",
  "hoang_anh.jpg": "team/hoang-anh-b4c814562385.jpg",
  "hoanganh.jpg": "team/hoang-anh-b4c814562385.jpg",
  "image-removebg-preview.png": "ui/image-removebg-preview-25ff5ff1cb63.png",
  "image/ao_dai/d_chic_thien_y.jpg": "products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg",
  "image/ao_dai/d.chic_xuan_vien.jpg": "products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg",
  "image/ao_dai/dchic_couture.jpg": "products/ao-dai/dchic-couture-11a66bffc46b.jpg",
  "image/ao_dai/dchic_y_nhien.jpg": "products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg",
  "image/ao_dai/dchic-nang-tho-pho-hoi.jpg": "products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg",
  "image/ao_dai/flane_uyenkhanh.jpg": "products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg",
  "image/ao_dai/linn_design_tue_hien.jpg": "products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg",
  "image/ao_dai/mainichi_moc_mien.png": "products/ao-dai/mainichi-moc-mien-01806b1b979a.png",
  "image/ao_dai/mainichi_yen_chi.jpg": "products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg",
  "image/ao_dai/maison_long_niem_no.jpg": "products/ao-dai/maison-long-niem-no-800686bb8652.jpg",
  "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-3_93465ac020774322b3a5308501a68c69_grande.jpg": "news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-3-93465ac020774322b3a5308501a68c69-grande-762feda59c9c.webp",
  "image/news/do_vang_ngay_quoc_khanh_cuu_chien_binh_viet_nam_poster-4_6c96da420d5c4267aa6fbe89a1658cd9_1024x1024.jpg": "news/do-vang-ngay-quoc-khanh-cuu-chien-binh-viet-nam-poster-4-6c96da420d5c4267aa6fbe89a1658cd9-1024x1-4d716bbd2f75.webp",
  "image/news/thue_ao_dai_tet_2026_tai_ho_chi_minh_gia_re_mau_dep_hot_trend.jpg": "news/thue-ao-dai-tet-2026-tai-ho-chi-minh-gia-re-mau-dep-hot-trend-251f2801fcb4.jpg",
  "image/news/thue_trang_phuc_bieu_dien_re_dep_hcm_sand_outfit.jpg": "news/thue-trang-phuc-bieu-dien-re-dep-hcm-sand-outfit-cedc9f1b9405.webp",
  "image/news/tuyen_tap_outfit_giang_sinh_do_hoa_trang_sand_cho_thue_trang_phuc_re_dep_tai_hcm.jpg": "news/tuyen-tap-outfit-giang-sinh-do-hoa-trang-sand-cho-thue-trang-phuc-re-dep-tai-hcm-b4247e92c952.webp",
  "image/phu_kien/com_bo_phu_kien_ao_dai.jpg": "products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg",
  "image/phu_kien/combo_ngoc_trai.jpg": "products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg",
  "image/phu_kien/tui_da_den_mysp.jpg": "products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg",
  "image/phu_kien/tui_da_do.jpg": "products/phu-kien/tui-da-do-ac94ff1d6b71.jpg",
  "image/phu_kien/tui_mu_di_bien.jpg": "products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg",
  "image/phu_kien/tui_nhung_den_dchic.jpg": "products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg",
  "image/phu_kien/tui_trung_ngoc_trai.jpg": "products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg",
  "image/vay_di_bien/amelie_vanessa_dress_xanh_nhat.jpg": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
  "image/vay_di_bien/amelie_vay_bi_babydoll_co_yem.jpg": "products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg",
  "image/vay_di_bien/ameliee_diva.webp": "products/vay-di-bien/ameliee-diva-ac220ddca95e.webp",
  "image/vay_di_bien/ameliee_garment.jpg": "products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg",
  "image/vay_di_bien/bliss_shop.webp": "products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
  "image/vay_di_bien/chou_chou_dam_ren_nude_dang_dai.jpg": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
  "image/vay_di_bien/chouchou_1kem.jpg": "products/vay-di-bien/chouchou-1kem-e22f3d36d93a.jpg",
  "image/vay_di_bien/chouchou_1xanh_bien.png": "products/vay-di-bien/chouchou-1xanh-bien-20953e05ba48.png",
  "image/vay_di_bien/d.chic_vay_maxi.jpg": "products/vay-di-bien/d-chic-vay-maxi-4ea56c16ddb1.jpg",
  "image/vay_di_bien/flane_ren_bo_mui_tre_vai.jpg": "products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg",
  "image/vay_di_bien/flane_ren_co_yem.jpg": "products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg",
  "image/vay_di_bien/flane_vay2.webp": "products/vay-di-bien/flane-vay2-008f744fd0a3.webp",
  "image/vay_di_bien/flane_vay3.png": "products/vay-di-bien/flane-vay3-8e82cd0ca940.png",
  "image/vay_di_bien/jolie_loft_lua.jpg": "products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
  "image/vay_di_bien/jolie_loft_vay_luoi_molly_dress_nau.jpg": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
  "image/vay_di_bien/jolie_loft_vay_ren_co_tay.jpg": "products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg",
  "image/vay_di_bien/maison_long_thuy_mi.jpg": "products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg",
  "image/vay_di_bien/ononmade_lapetra.png": "products/vay-di-bien/ononmade-lapetra-b8eeb387a576.png",
  "image/vay_di_bien/set_vay_2_day_chan_vay_trang_kem_lannie.jpg": "products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg",
  "image/vay_di_bien/so_vintage_evelina.jpg": "products/vay-di-bien/so-vintage-evelina-10274dc315ac.jpg",
  "image/vay_di_bien/so_vintage_kasia.jpg": "products/vay-di-bien/so-vintage-kasia-58112c49e295.jpg",
  "image/vay_di_bien/tipblu_dam_voan_tim_lavender.jpg": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
  "image/vay_di_bien/vay_hoa_mua_he.jpg": "products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg",
  "image/vay_di_bien/vay_ren_phoi_to.jpg": "products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg",
  "image/vay_di_bien/vn-11134207-7ra0g-m94acl0rf23ybe.jpg": "products/vay-di-bien/bliss-shop-d09ac411a7b4.webp",
  "image/vay_du_tiec/amelie_vanessa_dress_xanh_nhat.jpg": "products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg",
  "image/vay_du_tiec/chouchou_dam_dai_ren_choang.jpg": "products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg",
  "image/vay_du_tiec/chouchou_dam_ren_nude_dang_dai.jpg": "products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg",
  "image/vay_du_tiec/huong_boutique_louise_lace_dress.jpg": "products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg",
  "image/vay_du_tiec/jolie_loft_dam_lua_kem_hali_dress.jpg": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
  "image/vay_du_tiec/jolie_loft_vay_lua_luala_dress.png": "products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
  "image/vay_du_tiec/jolie_loft_vay_luoi_molly_dress_nau.jpg": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
  "image/vay_du_tiec/so_vintage_lafine.jpg": "products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg",
  "image/vay_du_tiec/so_vintage_lyra.jpg": "products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg",
  "image/vay_du_tiec/so_vintage_nathalia.jpg": "products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
  "image/vay_du_tiec/so_vintage_velia.jpg": "products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg",
  "image/vay_du_tiec/so_vintage_velia(den).jpg": "products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg",
  "image/vay_du_tiec/so_vintage_veliana.png": "products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png",
  "image/vay_du_tiec/so_vintage_veliana(den).jpg": "products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg",
  "image/vay_du_tiec/tipblu_dam_voan_tim_lavender.jpg": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
  "image/vay_du_tiec/wonder_house_lua_dress_kem.jpg": "products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
  "image/vay_lua/jolie_loft_dam_lua_kem_hali_dress.jpg": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
  "image/vay_lua/jolie_loft_lua.jpg": "products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg",
  "image/vay_lua/jolie_loft_vaylua_dress.png": "products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png",
  "image/vay_lua/wonder_house_lua_dress_kem.jpg": "products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg",
  "jolie-loft-dam-lua-kem-hali-dress.jpg": "products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg",
  "jolie-loft-vay-luoi-molly-dress-nau.jpg": "products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg",
  "Logo.png": "ui/logo-9045f298df84.png",
  "nguyen_duc_duong.jpg": "team/nguyen-duc-duong-db37e8cc4149.jpg",
  "phan_huyen_tran.jpg": "team/phan-huyen-tran-3c787b97b694.jpg",
  "so-vintage-nathalia.jpg": "products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg",
  "step-robot.jpg": "ui/step-robot-ac03f5f13489.jpg",
  "step-search.jpg": "ui/step-search-59436d703cb5.jpg",
  "step-truck.jpg": "ui/step-truck-ed32da7a6fe3.jpg",
  "tipblu-dam-voan-tim-lavender.jpg": "products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg",
  "tran_bao_lam.jpg": "team/tran-bao-lam-ef0fd0191017.jpg"
}
```

## `frontend/src/utils/assetUrl.js`

```js
const rawAssetBaseUrl = import.meta.env?.VITE_ASSET_BASE_URL || '';

function isAbsoluteUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value);
}

export function joinAssetUrl(baseUrl, key) {
  const rawKey = String(key || '');

  if (isAbsoluteUrl(rawKey)) {
    return rawKey;
  }

  const normalizedKey = rawKey.replace(/^\/+/, '');
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');

  if (!normalizedBase) {
    return normalizedKey ? `/${normalizedKey}` : '/';
  }

  return normalizedKey ? `${normalizedBase}/${normalizedKey}` : normalizedBase;
}

export function assetUrl(key) {
  return joinAssetUrl(rawAssetBaseUrl, key);
}
```

## `frontend/src/utils/apiError.js`

```js
export function getApiErrorMessage(error, fallback = 'Cﾃｳ l盻擁 x蘯｣y ra.') {
  const data = error?.response?.data;
  const candidates = [
    data?.error?.message,
    data?.title,
    data?.message,
    data?.error,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}
```

## `frontend/src/features/cart/cartService.js`

```js
import { dispatchAppEvent, getBrowserStorage, readArrayValue, writeJsonValue } from '../../utils/browserStorage.js';
import api from '../../config/api.js';

export const CART_KEY = 'dorentme_cart';
export const CART_CHANGED_EVENT = 'cart:changed';
const SESSION_KEY = 'dorentme_session';
const DEFAULT_RENTAL_DAYS = 3;

export function parsePrice(value) {
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  return Number.parseInt(digits, 10) || 0;
}

export function formatVnd(value) {
  return `${(value || 0).toLocaleString('vi-VN')} vnd`;
}

export function getCart(storage = getBrowserStorage()) {
  return readArrayValue(storage, CART_KEY);
}

export function saveCart(cart, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);

  writeJsonValue(storage, CART_KEY, cart);
  dispatchAppEvent(eventTarget, CART_CHANGED_EVENT, cart);
  return cart;
}

export function countCartItems(cart = getCart()) {
  return cart.reduce((sum, item) => sum + (Number(item?.qty) || 1), 0);
}

export function getCartTotals(cart = getCart()) {
  return cart.reduce(
    (totals, item) => {
      const qty = Number(item?.qty ?? item?.quantity) || 1;
      totals.qty += qty;
      totals.rent += Number(item?.lineSubtotal) || (parsePrice(item?.price3day) * qty);
      totals.deposit += Number(item?.deposit) || (parsePrice(item?.priceDeposit) * qty);
      totals.total = totals.rent + totals.deposit;
      return totals;
    },
    { qty: 0, rent: 0, deposit: 0, total: 0 },
  );
}

export function toLegacyCartItem(product, quantity) {
  const item = {
    name: product.name,
    image: product.image || '',
    category: product.category || product.categoryLabel || '',
    price3day: product.price3day || '',
    price1day: product.price1day || '',
    priceTag: product.priceTag || '',
    priceDeposit: product.priceDeposit || '',
    priceExtra: product.priceExtra || '',
    qty: quantity,
  };
  const variant = selectDefaultVariant(product);
  if (product.id && variant?.id) {
    item.productId = product.id;
    item.productVariantId = variant.id;
    item.rentalStartDate = defaultRentalStartDate();
    item.rentalEndDate = defaultRentalEndDate();
  }
  return item;
}

export function addProductToCart(product, quantity = 1, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const cart = getCart(storage);
  const existing = cart.find((item) => item.name === product.name);

  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + qty;
  } else {
    cart.push(toLegacyCartItem(product, qty));
  }

  return saveCart(cart, options);
}

export function removeCartItem(name, options = {}) {
  const storage = options.storage || getBrowserStorage();
  return saveCart(getCart(storage).filter((item) => item.name !== name), options);
}

export function setCartItemQty(name, quantity, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const cart = getCart(storage);
  const item = cart.find((candidate) => candidate.name === name);

  if (item) {
    item.qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  }

  return saveCart(cart, options);
}

export function decrementCartItem(name, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const item = getCart(storage).find((candidate) => candidate.name === name);
  if (!item) return getCart(storage);
  if ((Number(item.qty) || 1) <= 1) return removeCartItem(name, options);
  return setCartItemQty(name, (Number(item.qty) || 1) - 1, options);
}

export function clearCart(options = {}) {
  return saveCart([], options);
}

export function hasServerSession(storage = getBrowserStorage()) {
  return Boolean(readSession(storage)?.token);
}

export async function getActiveCartState(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) {
    const items = getCart(storage);
    return { source: 'guest', cart: null, items, totals: getCartTotals(items), count: countCartItems(items) };
  }

  const cart = await fetchServerCart();
  const items = mapServerCartItems(cart);
  return { source: 'server', cart, items, totals: serverTotals(cart), count: cart.itemCount || 0 };
}

export async function addProductToActiveCart(product, quantity = 1, options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) {
    return { source: 'guest', cart: addProductToCart(product, quantity, options) };
  }

  const variant = selectDefaultVariant(product);
  if (!variant?.id) {
    throw new Error('S蘯｣n ph蘯ｩm chﾆｰa cﾃｳ bi蘯ｿn th盻・kh蘯｣ d盻･ng ﾄ黛ｻ・thﾃｪm vﾃo gi盻・');
  }

  const cart = await addServerCartItem({
    productVariantId: variant.id,
    quantity,
    rentalStartDate: defaultRentalStartDate(),
    rentalEndDate: defaultRentalEndDate(),
  });
  dispatchCartChanged(cart);
  return { source: 'server', cart };
}

export async function setActiveCartItemQty(item, quantity) {
  if (!item?.serverItem) return setCartItemQty(item.name, quantity);
  const cart = await updateServerCartItem(item.id, {
    quantity,
    rentalStartDate: item.rentalStartDate,
    rentalEndDate: item.rentalEndDate,
  });
  dispatchCartChanged(cart);
  return cart;
}

export async function decrementActiveCartItem(item) {
  const qty = Number(item?.qty ?? item?.quantity) || 1;
  if (qty <= 1) return removeActiveCartItem(item);
  return setActiveCartItemQty(item, qty - 1);
}

export async function removeActiveCartItem(item) {
  if (!item?.serverItem) return removeCartItem(item.name);
  const cart = await removeServerCartItem(item.id);
  dispatchCartChanged(cart);
  return cart;
}

export async function clearActiveCart(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) return clearCart(options);
  const cart = await clearServerCart();
  dispatchCartChanged(cart);
  return cart;
}

export async function syncGuestCartToServer(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) return { migrated: 0, failed: [] };

  const guestItems = getCart(storage);
  const migratedNames = new Set();
  const failed = [];

  for (const item of guestItems) {
    if (!item.productVariantId) {
      failed.push({ item, reason: 'missing_variant' });
      continue;
    }

    try {
      await addServerCartItem({
        productVariantId: item.productVariantId,
        quantity: Number(item.qty) || 1,
        rentalStartDate: item.rentalStartDate || defaultRentalStartDate(),
        rentalEndDate: item.rentalEndDate || defaultRentalEndDate(),
      });
      migratedNames.add(item.name);
    } catch (error) {
      failed.push({ item, reason: error.response?.data?.error?.message || error.message });
    }
  }

  if (migratedNames.size > 0) {
    saveCart(guestItems.filter((item) => !migratedNames.has(item.name)), options);
  }

  const cart = await fetchServerCart();
  dispatchCartChanged(cart);
  return { migrated: migratedNames.size, failed, cart };
}

export async function fetchServerCart() {
  const response = await api.get('/api/cart');
  return response.data?.data;
}

export async function addServerCartItem(payload) {
  const response = await api.post('/api/cart/items', payload);
  return response.data?.data;
}

export async function updateServerCartItem(itemId, payload) {
  const response = await api.put(`/api/cart/items/${itemId}`, payload);
  return response.data?.data;
}

export async function removeServerCartItem(itemId) {
  const response = await api.delete(`/api/cart/items/${itemId}`);
  return response.data?.data;
}

export async function clearServerCart() {
  const response = await api.delete('/api/cart');
  return response.data?.data;
}

function mapServerCartItems(cart) {
  return (cart?.items || []).map((item) => ({
    ...item,
    id: item.id,
    serverItem: true,
    name: item.productName,
    image: item.image || '',
    category: `${item.size} / ${item.color}`,
    price3day: formatVnd(item.rentalPrice),
    priceDeposit: formatVnd(item.deposit),
    qty: item.quantity,
  }));
}

function serverTotals(cart) {
  return {
    qty: cart?.itemCount || 0,
    rent: cart?.subtotal || 0,
    deposit: cart?.depositTotal || 0,
    total: cart?.grandTotalPreview || 0,
  };
}

function readSession(storage = getBrowserStorage()) {
  if (!storage) return null;
  try {
    return JSON.parse(storage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function selectDefaultVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant) => variant.isActive !== false && (variant.availableStock ?? 1) > 0)
    || variants.find((variant) => variant.isActive !== false)
    || variants[0];
}

function defaultRentalStartDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultRentalEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_RENTAL_DAYS);
  return date.toISOString().slice(0, 10);
}

function dispatchCartChanged(cart) {
  dispatchAppEvent(typeof document !== 'undefined' ? document : null, CART_CHANGED_EVENT, cart);
}
```

## `backend/DoRentMe.Api/Data/DoRentMeDbContext.cs`

```csharp
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Data;

public class DoRentMeDbContext : DbContext
{
    public DoRentMeDbContext(DbContextOptions<DoRentMeDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    public DbSet<UserAddress> UserAddresses => Set<UserAddress>();
    public DbSet<Shop> Shops => Set<Shop>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Brand> Brands => Set<Brand>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductImage> ProductImages => Set<ProductImage>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<ProductInventoryItem> ProductInventoryItems => Set<ProductInventoryItem>();
    public DbSet<ProductCategory> ProductCategories { get; set; }
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<RentalReservation> RentalReservations => Set<RentalReservation>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<PaymentTransaction> PaymentTransactions => Set<PaymentTransaction>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<ShipmentTrackingEvent> ShipmentTrackingEvents => Set<ShipmentTrackingEvent>();
    public DbSet<OrderStatusHistory> OrderStatusHistory => Set<OrderStatusHistory>();
    public DbSet<Refund> Refunds => Set<Refund>();
    public DbSet<ReturnInspection> ReturnInspections => Set<ReturnInspection>();
    public DbSet<ProductLike> ProductLikes => Set<ProductLike>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ChatSession> ChatSessions => Set<ChatSession>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<TryOnRequest> TryOnRequests => Set<TryOnRequest>();
    public DbSet<LoyaltyTransaction> LoyaltyTransactions => Set<LoyaltyTransaction>();
    public DbSet<Voucher> Vouchers => Set<Voucher>();
    public DbSet<UserVoucher> UserVouchers => Set<UserVoucher>();
    public DbSet<ContactMessage> ContactMessages => Set<ContactMessage>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<ProductMonthlyStat> ProductMonthlyStats => Set<ProductMonthlyStat>();
    public DbSet<Notification> Notifications => Set<Notification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        ConfigureIdentity(modelBuilder);
        ConfigureCatalog(modelBuilder);
        ConfigureCartAndRental(modelBuilder);
        ConfigureOrderAndFulfillment(modelBuilder);
        ConfigureEngagementAndAi(modelBuilder);
        ConfigureLoyaltyAndContent(modelBuilder);
        ConfigureIndexes(modelBuilder);
    }

    private static void ConfigureIdentity(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("Roles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(255);
            entity.HasIndex(x => x.Code).IsUnique();
            entity.HasIndex(x => x.Name).IsUnique();

            entity.HasData(
                new Role { Id = 1, Code = "CUSTOMER", Name = "Customer", Description = "Customer who rents fashion products", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 2, Code = "LENDER", Name = "Lender", Description = "User who owns and lists rental products", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                new Role { Id = 3, Code = "ADMIN", Name = "Admin", Description = "Platform administrator", CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
            );
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", table =>
                table.HasCheckConstraint("CK_Users_LoyaltyPoints", "`LoyaltyPoints` >= 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.PasswordHash).HasMaxLength(255).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasIndex(x => x.RoleId);

            entity.HasOne(x => x.Role)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.Ignore(x => x.OwnedProducts);
        });

        modelBuilder.Entity<UserAddress>(entity =>
        {
            entity.ToTable("UserAddresses");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ReceiverName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.AddressLine).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Ward).HasMaxLength(100);
            entity.Property(x => x.District).HasMaxLength(100);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.Note).HasMaxLength(500);
            entity.HasIndex(x => x.UserId);

            entity.HasOne(x => x.User)
                .WithMany(x => x.Addresses)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Shop>(entity =>
        {
            entity.ToTable("Shops");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150);
            entity.Property(x => x.Address).HasMaxLength(500).IsRequired();
            entity.Property(x => x.Ward).HasMaxLength(100);
            entity.Property(x => x.District).HasMaxLength(100);
            entity.Property(x => x.City).HasMaxLength(100);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.HasIndex(x => x.IsActive);

            entity.Ignore(x => x.OwnerUserId);
            entity.Ignore(x => x.OwnerUser);
        });

        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("Categories");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.Ignore(x => x.Products);
        });

        modelBuilder.Entity<Brand>(entity =>
        {
            entity.ToTable("Brands");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.Name).IsUnique();
            entity.HasIndex(x => x.Slug).IsUnique();
        });
    }

    private static void ConfigureCatalog(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products", table =>
            {
                table.HasCheckConstraint("CK_Products_Price1Day", "`Price1Day` >= 0");
                table.HasCheckConstraint("CK_Products_Price3Day", "`Price3Day` >= 0");
                table.HasCheckConstraint("CK_Products_ExtraDayPrice", "`ExtraDayPrice` >= 0");
                table.HasCheckConstraint("CK_Products_PriceTag", "`PriceTag` IS NULL OR `PriceTag` >= 0");
                table.HasCheckConstraint("CK_Products_PriceDeposit", "`PriceDeposit` >= 0");
                table.HasCheckConstraint("CK_Products_PurchaseCost", "`PurchaseCost` IS NULL OR `PurchaseCost` >= 0");
                table.HasCheckConstraint("CK_Products_CleaningCost", "`CleaningCost` >= 0");
                table.HasCheckConstraint("CK_Products_MaintenanceCost", "`MaintenanceCost` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(220).IsRequired();
            entity.Property(x => x.Description).HasColumnType("longtext");
            entity.Property(x => x.Price1Day).HasPrecision(18, 2);
            entity.Property(x => x.Price3Day).HasPrecision(18, 2);
            entity.Property(x => x.ExtraDayPrice).HasPrecision(18, 2);
            entity.Property(x => x.PriceTag).HasPrecision(18, 2);
            entity.Property(x => x.PriceDeposit).HasPrecision(18, 2);
            entity.Property(x => x.PurchaseCost).HasPrecision(18, 2);
            entity.Property(x => x.CleaningCost).HasPrecision(18, 2);
            entity.Property(x => x.MaintenanceCost).HasPrecision(18, 2);
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.HasOne(x => x.Shop).WithMany(x => x.Products).HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Brand).WithMany(x => x.Products).HasForeignKey(x => x.BrandId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductCategory>(entity =>
        {
            entity.HasKey(pc => new
            {
                pc.ProductId,
                pc.CategoryId
            });

            entity.HasOne(pc => pc.Product)
                .WithMany(p => p.ProductCategories)
                .HasForeignKey(pc => pc.ProductId);

            entity.HasOne(pc => pc.Category)
                .WithMany(c => c.ProductCategories)
                .HasForeignKey(pc => pc.CategoryId);
        });
        
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.ToTable("ProductImages", table =>
                table.HasCheckConstraint("CK_ProductImages_SortOrder", "`SortOrder` >= 0"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ImageUrl).HasMaxLength(500).IsRequired();

            entity.Property<int?>("PrimaryProductId")
                .HasComputedColumnSql("CASE WHEN `IsPrimary` = 1 THEN `ProductId` ELSE NULL END", stored: true);
            entity.HasIndex("PrimaryProductId")
                .IsUnique()
                .HasDatabaseName("UX_ProductImages_OnePrimaryPerProduct");

            entity.HasOne(x => x.Product).WithMany(x => x.Images).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.ToTable("ProductVariants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Size).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Color).HasMaxLength(80).IsRequired();
            entity.Property(x => x.VariantCode).HasMaxLength(100);
            entity.HasIndex(x => new { x.ProductId, x.Size, x.Color }).IsUnique();
            entity.HasIndex(x => x.VariantCode).IsUnique();

            entity.HasOne(x => x.Product).WithMany(x => x.Variants).HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ProductInventoryItem>(entity =>
        {
            entity.ToTable("ProductInventoryItems", table =>
            {
                table.HasCheckConstraint("CK_ProductInventoryItems_Condition",
                    "`Condition` IN ('NEW','GOOD','FAIR','WORN','DAMAGED')");
                table.HasCheckConstraint("CK_ProductInventoryItems_Status",
                    "`Status` IN ('AVAILABLE','RESERVED','RENTED','CLEANING','MAINTENANCE','DAMAGED','LOST','RETIRED')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.AssetCode).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Condition).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Notes).HasMaxLength(500);
            entity.HasIndex(x => x.AssetCode).IsUnique();
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.ProductVariant).WithMany(x => x.InventoryItems).HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureCartAndRental(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Cart>(entity =>
        {
            entity.ToTable("Carts", table =>
            {
                table.HasCheckConstraint("CK_Carts_UserOrSession", "`UserId` IS NOT NULL OR `SessionId` IS NOT NULL");
                table.HasCheckConstraint("CK_Carts_Status", "`Status` IN ('active','ordered','abandoned')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SessionId).HasMaxLength(100);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();

            entity.Property<int?>("ActiveUserId")
                .HasComputedColumnSql("CASE WHEN `Status` = 'active' THEN `UserId` ELSE NULL END", stored: true);
            entity.Property<string?>("ActiveSessionId")
                .HasMaxLength(100)
                .HasComputedColumnSql("CASE WHEN `Status` = 'active' THEN `SessionId` ELSE NULL END", stored: true);
            entity.HasIndex("ActiveUserId").IsUnique().HasDatabaseName("UX_Carts_Active_User");
            entity.HasIndex("ActiveSessionId").IsUnique().HasDatabaseName("UX_Carts_Active_Session");

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<CartItem>(entity =>
        {
            entity.ToTable("CartItems", table =>
            {
                table.HasCheckConstraint("CK_CartItems_Quantity", "`Quantity` > 0");
                table.HasCheckConstraint("CK_CartItems_DateRange", "`RentalEndDate` > `RentalStartDate`");
            });
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.CartId, x.ProductVariantId, x.RentalStartDate, x.RentalEndDate }).IsUnique();

            entity.HasOne(x => x.Cart).WithMany(x => x.Items).HasForeignKey(x => x.CartId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductVariant).WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<RentalReservation>(entity =>
        {
            entity.ToTable("RentalReservations", table =>
            {
                table.HasCheckConstraint("CK_RentalReservations_DateRange", "`EndDate` > `StartDate`");
                table.HasCheckConstraint("CK_RentalReservations_Status", "`Status` IN ('RESERVED','ACTIVE','COMPLETED','CANCELLED')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasIndex(x => new { x.ProductInventoryItemId, x.StartDate, x.EndDate, x.Status })
                .HasDatabaseName("IX_RentalReservations_Inventory_Date_Status");

            entity.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductInventoryItem).WithMany().HasForeignKey(x => x.ProductInventoryItemId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureOrderAndFulfillment(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders", table =>
            {
                table.HasCheckConstraint("CK_Orders_Status",
                    "`Status` IN ('pending_confirmation','shipping','delivered','return_requested','return_processing','returned','cancelled')");
                table.HasCheckConstraint("CK_Orders_TotalRent", "`TotalRent` >= 0");
                table.HasCheckConstraint("CK_Orders_TotalDeposit", "`TotalDeposit` >= 0");
                table.HasCheckConstraint("CK_Orders_TotalDiscount", "`TotalDiscount` >= 0");
                table.HasCheckConstraint("CK_Orders_DateRange", "`EndDate` > `StartDate`");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.OrderCode).HasMaxLength(50).IsRequired();
            entity.Property(x => x.CustomerName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.CustomerPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.CustomerEmail).HasMaxLength(150);
            entity.Property(x => x.ShippingAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.CustomerNote).HasMaxLength(500);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TotalRent).HasPrecision(18, 2);
            entity.Property(x => x.TotalDeposit).HasPrecision(18, 2);
            entity.Property(x => x.TotalDiscount).HasPrecision(18, 2);
            entity.Property(x => x.TotalAmount)
                .HasPrecision(18, 2)
                .HasComputedColumnSql("(`TotalRent` + `TotalDeposit` - `TotalDiscount`)", stored: true);
            entity.HasIndex(x => x.OrderCode).IsUnique();

            entity.HasOne(x => x.Shop).WithMany().HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems", table =>
            {
                table.HasCheckConstraint("CK_OrderItems_Quantity", "`Quantity` > 0");
                table.HasCheckConstraint("CK_OrderItems_PricePerItem", "`PricePerItem` >= 0");
                table.HasCheckConstraint("CK_OrderItems_DepositPerItem", "`DepositPerItem` >= 0");
                table.HasCheckConstraint("CK_OrderItems_DateRange", "`RentalEndDate` > `RentalStartDate`");
                table.HasCheckConstraint("CK_OrderItems_RentalDays", "`RentalDays` > 0");
                table.HasCheckConstraint("CK_OrderItems_LineSubtotal", "`LineSubtotal` >= 0");
                table.HasCheckConstraint("CK_OrderItems_DepositSubtotal", "`DepositSubtotal` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ProductNameSnapshot).HasMaxLength(200).IsRequired();
            entity.Property(x => x.SizeSnapshot).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ColorSnapshot).HasMaxLength(80).IsRequired();
            entity.Property(x => x.PricePerItem).HasPrecision(18, 2);
            entity.Property(x => x.DepositPerItem).HasPrecision(18, 2);
            entity.Property(x => x.LineSubtotal).HasPrecision(18, 2);
            entity.Property(x => x.DepositSubtotal).HasPrecision(18, 2);

            entity.HasOne(x => x.Order).WithMany(x => x.Items).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductVariant).WithMany().HasForeignKey(x => x.ProductVariantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.ToTable("Payments", table =>
            {
                table.HasCheckConstraint("CK_Payments_Amount", "`Amount` >= 0");
                table.HasCheckConstraint("CK_Payments_Status", "`Status` IN ('pending','paid','failed','refunded','cancelled')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Method).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.Property(x => x.TransferContent).HasMaxLength(200);
            entity.Property(x => x.TransactionCode).HasMaxLength(100);
            entity.Property(x => x.ProviderTransactionId).HasMaxLength(150);
            entity.HasIndex(x => x.ProviderTransactionId).IsUnique();

            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ConfirmedByUser).WithMany().HasForeignKey(x => x.ConfirmedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Shipment>(entity =>
        {
            entity.ToTable("Shipments", table =>
            {
                table.HasCheckConstraint("CK_Shipments_Direction", "`Direction` IN ('outbound','return')");
                table.HasCheckConstraint("CK_Shipments_Status",
                    "`Status` IN ('pending','created','assigned','picked_up','shipping','delivered','failed','cancelled','returning','returned')");
                table.HasCheckConstraint("CK_Shipments_ShippingFee", "`ShippingFee` >= 0");
                table.HasCheckConstraint("CK_Shipments_CodAmount", "`CodAmount` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Direction).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Provider).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ServiceType).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.TrackingCode).HasMaxLength(100);
            entity.Property(x => x.ProviderOrderCode).HasMaxLength(100);
            entity.Property(x => x.SenderName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.SenderPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.SenderAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ReceiverName).HasMaxLength(100).IsRequired();
            entity.Property(x => x.ReceiverPhone).HasMaxLength(20).IsRequired();
            entity.Property(x => x.ReceiverAddress).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ShippingFee).HasPrecision(18, 2);
            entity.Property(x => x.CodAmount).HasPrecision(18, 2);
            entity.Property(x => x.RawProviderResponse).HasColumnType("longtext");

            entity.HasOne(x => x.Shop).WithMany().HasForeignKey(x => x.ShopId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ShipmentTrackingEvent>(entity =>
        {
            entity.ToTable("ShipmentTrackingEvents");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(500);
            entity.Property(x => x.Location).HasMaxLength(255);
            entity.Property(x => x.ProviderEventCode).HasMaxLength(100);
            entity.Property(x => x.RawEvent).HasColumnType("longtext");

            entity.HasOne(x => x.Shipment).WithMany(x => x.TrackingEvents).HasForeignKey(x => x.ShipmentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<OrderStatusHistory>(entity =>
        {
            entity.ToTable("OrderStatusHistory");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.OldStatus).HasMaxLength(50);
            entity.Property(x => x.NewStatus).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(500);

            entity.HasOne(x => x.Order).WithMany(x => x.StatusHistory).HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.CreatedByUser).WithMany().HasForeignKey(x => x.CreatedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<PaymentTransaction>(entity =>
        {
            entity.ToTable("PaymentTransactions", table =>
            {
                table.HasCheckConstraint("CK_PaymentTransactions_Amount", "`Amount` >= 0");
                table.HasCheckConstraint("CK_PaymentTransactions_Status", "`Status` IN ('pending','paid','failed','cancelled','expired')");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Provider).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ProviderTransactionId).HasMaxLength(150);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.CheckoutUrl).HasMaxLength(1000);
            entity.Property(x => x.QrCode).HasMaxLength(2000);
            entity.HasOne(x => x.Payment).WithMany(x => x.Transactions).HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Refund>(entity =>
        {
            entity.ToTable("Refunds", table =>
            {
                table.HasCheckConstraint("CK_Refunds_Type", "`Type` IN ('deposit','order_cancel','compensation','other')");
                table.HasCheckConstraint("CK_Refunds_Status", "`Status` IN ('pending','processing','completed','rejected','cancelled')");
                table.HasCheckConstraint("CK_Refunds_Amount", "`Amount` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Amount).HasPrecision(18, 2);
            entity.Property(x => x.Reason).HasMaxLength(500);
            entity.Property(x => x.BankName).HasMaxLength(100);
            entity.Property(x => x.BankAccountNo).HasMaxLength(50);
            entity.Property(x => x.BankAccountName).HasMaxLength(100);
            entity.Property(x => x.TransactionCode).HasMaxLength(100);

            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Payment).WithMany().HasForeignKey(x => x.PaymentId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.RequestedByUser).WithMany().HasForeignKey(x => x.RequestedByUserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProcessedByUser).WithMany().HasForeignKey(x => x.ProcessedByUserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ReturnInspection>(entity =>
        {
            entity.ToTable("ReturnInspections", table =>
            {
                table.HasCheckConstraint("CK_ReturnInspections_Condition", "`ConditionAfterReturn` IN ('NEW','GOOD','FAIR','WORN','DAMAGED')");
                table.HasCheckConstraint("CK_ReturnInspections_RecommendedDeduction", "`RecommendedDeduction` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.ConditionAfterReturn).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DamageDescription).HasMaxLength(1000);
            entity.Property(x => x.RecommendedDeduction).HasPrecision(18, 2);
            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.ProductInventoryItem).WithMany().HasForeignKey(x => x.ProductInventoryItemId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.InspectorUser).WithMany().HasForeignKey(x => x.InspectorUserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureEngagementAndAi(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ProductLike>(entity =>
        {
            entity.ToTable("ProductLikes");
            entity.HasKey(x => x.Id);
            entity.HasIndex(x => new { x.UserId, x.ProductId }).IsUnique();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("Reviews", table =>
                table.HasCheckConstraint("CK_Reviews_Rating", "`Rating` BETWEEN 1 AND 5"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Comment).HasMaxLength(1000);
            entity.HasIndex(x => new { x.UserId, x.OrderItemId }).IsUnique();

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.OrderItem).WithMany().HasForeignKey(x => x.OrderItemId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.ToTable("ChatSessions");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.SessionId).HasMaxLength(100).IsRequired();
            entity.HasIndex(x => x.SessionId).IsUnique();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("ChatMessages", table =>
                table.HasCheckConstraint("CK_ChatMessages_Role", "`Role` IN ('user','model','system')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Role).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Message).HasColumnType("longtext").IsRequired();
            entity.HasOne(x => x.ChatSession).WithMany(x => x.Messages).HasForeignKey(x => x.ChatSessionId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TryOnRequest>(entity =>
        {
            entity.ToTable("TryOnRequests", table =>
                table.HasCheckConstraint("CK_TryOnRequests_Status", "`Status` IN ('pending','processing','completed','failed')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RequestId).HasMaxLength(100);
            entity.Property(x => x.UserImageUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.GarmentImageUrl).HasMaxLength(500).IsRequired();
            entity.Property(x => x.ResultImageUrl).HasMaxLength(500);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.Property(x => x.ErrorMessage).HasMaxLength(500);
            entity.HasIndex(x => x.RequestId).IsUnique();

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureLoyaltyAndContent(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LoyaltyTransaction>(entity =>
        {
            entity.ToTable("LoyaltyTransactions", table =>
                table.HasCheckConstraint("CK_LoyaltyTransactions_Type", "`Type` IN ('earn','redeem','adjust')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Note).HasMaxLength(500);

            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Order).WithMany().HasForeignKey(x => x.OrderId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.ToTable("Vouchers", table =>
            {
                table.HasCheckConstraint("CK_Vouchers_DiscountType", "`DiscountType` IN ('fixed','percent')");
                table.HasCheckConstraint("CK_Vouchers_DiscountValue", "`DiscountValue` >= 0");
                table.HasCheckConstraint("CK_Vouchers_RequiredPoints", "`RequiredPoints` >= 0");
                table.HasCheckConstraint("CK_Vouchers_MinOrderAmount", "`MinOrderAmount` IS NULL OR `MinOrderAmount` >= 0");
                table.HasCheckConstraint("CK_Vouchers_UsageLimit", "`UsageLimit` IS NULL OR `UsageLimit` > 0");
                table.HasCheckConstraint("CK_Vouchers_UsedCount", "`UsedCount` >= 0");
                table.HasCheckConstraint("CK_Vouchers_DateRange", "`EndAt` IS NULL OR `StartAt` IS NULL OR `EndAt` > `StartAt`");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.DiscountType).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DiscountValue).HasPrecision(18, 2);
            entity.Property(x => x.MinOrderAmount).HasPrecision(18, 2);
            entity.HasIndex(x => x.Code).IsUnique();
        });

        modelBuilder.Entity<UserVoucher>(entity =>
        {
            entity.ToTable("UserVouchers", table =>
                table.HasCheckConstraint("CK_UserVouchers_Status", "`Status` IN ('available','used','expired')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Voucher).WithMany(x => x.UserVouchers).HasForeignKey(x => x.VoucherId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ContactMessage>(entity =>
        {
            entity.ToTable("ContactMessages", table =>
                table.HasCheckConstraint("CK_ContactMessages_Status", "`Status` IN ('new','read','replied','closed')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(150).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(20);
            entity.Property(x => x.Subject).HasMaxLength(200);
            entity.Property(x => x.Message).HasColumnType("longtext").IsRequired();
            entity.Property(x => x.Status).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<NewsArticle>(entity =>
        {
            entity.ToTable("NewsArticles");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Slug).HasMaxLength(255).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(500);
            entity.Property(x => x.Content).HasColumnType("longtext");
            entity.Property(x => x.ImageUrl).HasMaxLength(500);
            entity.HasIndex(x => x.Slug).IsUnique();

            entity.HasOne(x => x.Author)
                .WithMany()
                .HasForeignKey(x => x.AuthorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<ProductMonthlyStat>(entity =>
        {
            entity.ToTable("ProductMonthlyStats", table =>
            {
                table.HasCheckConstraint("CK_ProductMonthlyStats_Year", "`Year` >= 2000");
                table.HasCheckConstraint("CK_ProductMonthlyStats_Month", "`Month` BETWEEN 1 AND 12");
                table.HasCheckConstraint("CK_ProductMonthlyStats_TotalOrders", "`TotalOrders` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_TotalQuantityRented", "`TotalQuantityRented` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_RentRevenue", "`RentRevenue` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DepositCollected", "`DepositCollected` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DepositRefunded", "`DepositRefunded` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_ShippingFee", "`ShippingFee` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_DiscountAmount", "`DiscountAmount` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_CleaningCost", "`CleaningCost` >= 0");
                table.HasCheckConstraint("CK_ProductMonthlyStats_MaintenanceCost", "`MaintenanceCost` >= 0");
            });
            entity.HasKey(x => x.Id);
            entity.Property(x => x.RentRevenue).HasPrecision(18, 2);
            entity.Property(x => x.DepositCollected).HasPrecision(18, 2);
            entity.Property(x => x.DepositRefunded).HasPrecision(18, 2);
            entity.Property(x => x.ShippingFee).HasPrecision(18, 2);
            entity.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            entity.Property(x => x.CleaningCost).HasPrecision(18, 2);
            entity.Property(x => x.MaintenanceCost).HasPrecision(18, 2);
            entity.Property(x => x.GrossProfit)
                .HasPrecision(18, 2)
                .HasComputedColumnSql("(`RentRevenue` - `ShippingFee` - `DiscountAmount` - `CleaningCost` - `MaintenanceCost`)", stored: true);
            entity.HasIndex(x => new { x.ProductId, x.Year, x.Month }).IsUnique();

            entity.HasOne(x => x.Product).WithMany().HasForeignKey(x => x.ProductId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("Notifications", table =>
                table.HasCheckConstraint("CK_Notifications_Type", "`Type` IN ('order','payment','shipping','refund','voucher','system','tryon')"));
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Title).HasMaxLength(200).IsRequired();
            entity.Property(x => x.Message).HasMaxLength(1000).IsRequired();
            entity.Property(x => x.RelatedType).HasMaxLength(50);
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureIndexes(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Product>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Product>().HasIndex(x => x.BrandId);
        modelBuilder.Entity<Product>().HasIndex(x => x.IsActive);

        modelBuilder.Entity<ProductImage>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductVariant>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductInventoryItem>().HasIndex(x => x.ProductVariantId);

        modelBuilder.Entity<Cart>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Cart>().HasIndex(x => x.SessionId);
        modelBuilder.Entity<CartItem>().HasIndex(x => x.CartId);
        modelBuilder.Entity<CartItem>().HasIndex(x => x.ProductVariantId);

        modelBuilder.Entity<Order>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Order>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Order>().HasIndex(x => x.Status);
        modelBuilder.Entity<Order>().HasIndex(x => x.CreatedAt);

        modelBuilder.Entity<OrderItem>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<OrderItem>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<OrderItem>().HasIndex(x => x.ProductVariantId);
        modelBuilder.Entity<OrderItem>().HasIndex(x => new { x.ProductVariantId, x.RentalStartDate, x.RentalEndDate });

        modelBuilder.Entity<Payment>().HasIndex(x => x.OrderId).IsUnique();
        modelBuilder.Entity<Payment>().HasIndex(x => x.Status);
        modelBuilder.Entity<Payment>().HasIndex(x => x.TransactionCode);
        modelBuilder.Entity<PaymentTransaction>().HasIndex(x => x.PaymentId);
        modelBuilder.Entity<PaymentTransaction>().HasIndex(x => x.ProviderOrderCode).IsUnique();
        modelBuilder.Entity<PaymentTransaction>().HasIndex(x => x.ProviderTransactionId).IsUnique();
        modelBuilder.Entity<PaymentTransaction>().HasIndex(x => x.Status);

        modelBuilder.Entity<Shipment>().HasIndex(x => x.ShopId);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.Status);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.Direction);
        modelBuilder.Entity<Shipment>().HasIndex(x => x.TrackingCode);
        modelBuilder.Entity<ShipmentTrackingEvent>().HasIndex(x => new { x.ShipmentId, x.CreatedAt });

        modelBuilder.Entity<OrderStatusHistory>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<OrderStatusHistory>().HasIndex(x => new { x.OrderId, x.CreatedAt });

        modelBuilder.Entity<Refund>().HasIndex(x => x.OrderId);
        modelBuilder.Entity<Refund>().HasIndex(x => x.PaymentId);
        modelBuilder.Entity<Refund>().HasIndex(x => x.Status);
        modelBuilder.Entity<ReturnInspection>().HasIndex(x => new { x.OrderId, x.ProductInventoryItemId }).IsUnique();

        modelBuilder.Entity<ProductLike>().HasIndex(x => x.UserId);
        modelBuilder.Entity<ProductLike>().HasIndex(x => x.ProductId);

        modelBuilder.Entity<Review>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Review>().HasIndex(x => new { x.ProductId, x.CreatedAt });
        modelBuilder.Entity<Review>().HasIndex(x => x.OrderItemId);

        modelBuilder.Entity<ChatSession>().HasIndex(x => x.UserId);
        modelBuilder.Entity<ChatMessage>().HasIndex(x => new { x.ChatSessionId, x.CreatedAt });

        modelBuilder.Entity<TryOnRequest>().HasIndex(x => new { x.UserId, x.CreatedAt });
        modelBuilder.Entity<TryOnRequest>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<TryOnRequest>().HasIndex(x => x.Status);

        modelBuilder.Entity<LoyaltyTransaction>().HasIndex(x => new { x.UserId, x.CreatedAt });
        modelBuilder.Entity<UserVoucher>().HasIndex(x => new { x.UserId, x.Status });
        modelBuilder.Entity<UserVoucher>().HasIndex(x => x.VoucherId);

        modelBuilder.Entity<ContactMessage>().HasIndex(x => x.Status);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.AuthorId);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.IsPublished);
        modelBuilder.Entity<NewsArticle>().HasIndex(x => x.PublishedAt);

        modelBuilder.Entity<ProductMonthlyStat>().HasIndex(x => x.ProductId);
        modelBuilder.Entity<ProductMonthlyStat>().HasIndex(x => new { x.Year, x.Month });

        modelBuilder.Entity<Notification>().HasIndex(x => x.UserId);
        modelBuilder.Entity<Notification>().HasIndex(x => new { x.UserId, x.IsRead });
        modelBuilder.Entity<Notification>().HasIndex(x => x.Type);
    }
}
```

## `backend/DoRentMe.Api/Controllers/ProductController.cs`

```csharp
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace DoRentMe.Api.Controllers;

[Route("api/products")]
public class ProductController : ApiControllerBase
{
    private readonly IProductService _productService;

    public ProductController(IProductService productService)
    {
        _productService = productService;
    }

    [HttpPost]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Create(
        [FromBody] ProductCreateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.CreateAsync(
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return CreatedSuccess(product);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        var products = await _productService.GetAllAsync(
            request,
            GetOptionalUserId(),
            cancellationToken);

        return Success(products);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.GetByIdAsync(
            id,
            GetOptionalUserId(),
            cancellationToken);

        return Success(product);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] ProductUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.UpdateAsync(
            id,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(product);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var product = await _productService.DeleteAsync(
            id,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(product);
    }

    [HttpGet("{productId:int}/images")]
    public async Task<IActionResult> GetImages(
        int productId,
        CancellationToken cancellationToken)
    {
        var images = await _productService.GetImagesAsync(productId, cancellationToken);

        return Success(images);
    }

    [HttpPost("{productId:int}/images")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> AddImage(
        int productId,
        [FromBody] ProductImageRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var image = await _productService.AddImageAsync(
            productId,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return CreatedSuccess(image);
    }

    [HttpPut("{productId:int}/images/{imageId:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> UpdateImage(
        int productId,
        int imageId,
        [FromBody] ProductImageRequest request,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var image = await _productService.UpdateImageAsync(
            productId,
            imageId,
            request,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        return Success(image);
    }

    [HttpDelete("{productId:int}/images/{imageId:int}")]
    [Authorize(Roles = "ADMIN,LENDER")]
    public async Task<IActionResult> DeleteImage(
        int productId,
        int imageId,
        CancellationToken cancellationToken)
    {
        var currentUser = GetCurrentUser();
        var deleted = await _productService.DeleteImageAsync(
            productId,
            imageId,
            currentUser.UserId,
            currentUser.Role,
            cancellationToken);

        if (!deleted)
        {
            throw new ApiException(
                ErrorCodes.NotFound,
                "Product image not found.",
                StatusCodes.Status404NotFound);
        }

        return NoContent();
    }

    [HttpPost("{id:int}/favorite")]
    [Authorize]
    public async Task<IActionResult> Favorite(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.FavoriteAsync(
            id,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(product);
    }

    [HttpDelete("{id:int}/favorite")]
    [Authorize]
    public async Task<IActionResult> Unfavorite(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _productService.UnfavoriteAsync(
            id,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(product);
    }

    [HttpGet("favorites")]
    [Authorize]
    public async Task<IActionResult> GetFavorites(
        [FromQuery] ProductQueryRequest request,
        CancellationToken cancellationToken)
    {
        var products = await _productService.GetFavoritesAsync(
            request,
            GetCurrentUser().UserId,
            cancellationToken);

        return Success(products);
    }

    private (int UserId, string Role) GetCurrentUser()
    {
        var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);
        var role = User.FindFirst(ClaimTypes.Role)?.Value ?? string.Empty;

        return (userId, role);
    }

    private int? GetOptionalUserId()
    {
        var userIdValue = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.TryParse(userIdValue, out var userId) ? userId : null;
    }
}
```

## `backend/DoRentMe.Api/Controllers/BrandController.cs`

```csharp
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Brand;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/brands")]
public class BrandController : ApiControllerBase
{
    private readonly IBrandService _brandService;

    public BrandController(IBrandService brandService)
    {
        _brandService = brandService;
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<BrandResponses>),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        BrandRequests request,
        CancellationToken cancellationToken)
    {
        var brand = await _brandService.CreateAsync(
            request,
            cancellationToken);

        var response = new BrandResponses
        {
            Id = brand.Id,
            Message = "Brand created successfully."
        };

        return CreatedSuccess(response);
    }

    [HttpGet]
    [ProducesResponseType(
    typeof(ApiResponse<List<BrandReadResponses>>),
    StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
    CancellationToken cancellationToken)
    {
        var brands = await _brandService.GetAllAsync(
            cancellationToken);

        var response = brands
            .Select(brand => new BrandReadResponses
            {
                Id = brand.Id,
                Name = brand.Name,
                Slug = brand.Slug,
                IsActive = brand.IsActive,
                CreatedAt = brand.CreatedAt,
                UpdatedAt = brand.UpdatedAt
            })
            .ToList();

        return Success(response);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(
    typeof(ApiResponse<BrandReadResponses>),
    StatusCodes.Status200OK)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
    int id,
    CancellationToken cancellationToken)
    {
        var brand = await _brandService.GetByIdAsync(
            id,
            cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        var response = new BrandReadResponses
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            IsActive = brand.IsActive,
            CreatedAt = brand.CreatedAt,
            UpdatedAt = brand.UpdatedAt
        };

        return Success(response);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(
    typeof(ApiResponse<BrandReadResponses>),
    StatusCodes.Status200OK)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
    int id,
    UpdateBrandRequest request,
    CancellationToken cancellationToken)
    {
        var brand = await _brandService.UpdateAsync(
            id,
            request,
            cancellationToken);

        var response = new BrandReadResponses
        {
            Id = brand.Id,
            Name = brand.Name,
            Slug = brand.Slug,
            IsActive = brand.IsActive,
            CreatedAt = brand.CreatedAt,
            UpdatedAt = brand.UpdatedAt
        };

        return Success(response);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(
    typeof(ApiErrorResponse),
    StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Delete(
    int id,
    CancellationToken cancellationToken)
    {
        await _brandService.DeleteAsync(
            id,
            cancellationToken);

        return NoContent();
    }
}
```

## `backend/DoRentMe.Api/Controllers/CategoriesController.cs`

```csharp
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Common.Responses;
using DoRentMe.Api.Contracts.Category;
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/categories")]
public class CategoryController : ApiControllerBase
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryResponses>),
        StatusCodes.Status201Created)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Create(
        CategoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.CreateAsync(
            request,
            cancellationToken);

        var response = new CategoryResponses
        {
            Id = category.Id,
            Message = "Category created successfully."
        };

        return CreatedSuccess(response);
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(ApiResponse<List<CategoryReadResponse>>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll(
        CancellationToken cancellationToken)
    {
        var categories = await _categoryService.GetAllAsync(
            cancellationToken);

        return Success(categories);
    }

    [HttpGet("{id:int}")]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryReadResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.GetByIdAsync(
            id,
            cancellationToken);

        if (category == null)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return Success(category);
    }

    [HttpPut("{id:int}")]
    [ProducesResponseType(
        typeof(ApiResponse<CategoryReadResponse>),
        StatusCodes.Status200OK)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status400BadRequest)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Update(
        int id,
        CategoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _categoryService.UpdateAsync(
            id,
            request,
            cancellationToken);

        if (category == null)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return Success(category);
    }

    [HttpDelete("{id:int}")]
    [ProducesResponseType(
        StatusCodes.Status204NoContent)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status404NotFound)]
    [ProducesResponseType(
        typeof(ApiErrorResponse),
        StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var deleted = await _categoryService.DeleteAsync(
            id,
            cancellationToken);

        if (!deleted)
        {
            throw new ApiException(
                "CATEGORY_NOT_FOUND",
                "Category not found.",
                StatusCodes.Status404NotFound);
        }

        return NoContent();
    }
}
```

## `backend/DoRentMe.Api/Controllers/ShopController.cs`

```csharp
using DoRentMe.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace DoRentMe.Api.Controllers;

[Route("api/shops")]
public class ShopController : ApiControllerBase
{
    private readonly IShopService _shopService;

    public ShopController(IShopService shopService)
    {
        _shopService = shopService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var shops = await _shopService.GetAllAsync(cancellationToken);

        return Success(shops);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var shop = await _shopService.GetByIdAsync(id, cancellationToken);

        return Success(shop);
    }
}
```

## `backend/DoRentMe.Api/Services/ProductService.cs`

```csharp
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Common;
using DoRentMe.Api.Contracts.Product;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ProductService : IProductService
{
    private const string AdminRole = "ADMIN";
    private const string LenderRole = "LENDER";
    private const string AvailableInventoryStatus = "AVAILABLE";

    private readonly DoRentMeDbContext _dbContext;

    public ProductService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ProductResponse> CreateAsync(
        ProductCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        await EnsureCanManageShopAsync(request.ShopId, currentUserId, currentUserRole, cancellationToken);
        await ValidateBrandAsync(request.BrandId, cancellationToken);
        var categoryIds = await ValidateCategoriesAsync(request.CategoryIds, cancellationToken);
        ValidateVariants(request.Variants.Select(v => (v.Size, v.Color)));

        var product = new Product
        {
            ShopId = request.ShopId,
            BrandId = request.BrandId,
            Name = request.Name.Trim(),
            Slug = GenerateSlug(request.Name),
            Description = request.Description?.Trim(),
            Price1Day = request.Price1Day,
            Price3Day = request.Price3Day,
            ExtraDayPrice = request.ExtraDayPrice,
            PriceTag = request.PriceTag,
            PriceDeposit = request.PriceDeposit,
            PurchaseCost = request.PurchaseCost,
            CleaningCost = request.CleaningCost,
            MaintenanceCost = request.MaintenanceCost,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            ProductCategories = categoryIds
                .Select(categoryId => new ProductCategory { CategoryId = categoryId })
                .ToList(),
            Variants = request.Variants
                .Select(v => new ProductVariant
                {
                    Size = v.Size.Trim(),
                    Color = v.Color.Trim(),
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                })
                .ToList()
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync(cancellationToken);

        foreach (var variant in product.Variants)
        {
            variant.VariantCode = GenerateVariantCode(product.Id, variant.Size, variant.Color);
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<PagedResponse<ProductResponse>> GetAllAsync(
        ProductQueryRequest request,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        return await GetPublicProductsAsync(request, currentUserId, null, cancellationToken);
    }

    public async Task<ProductResponse> GetByIdAsync(
        int id,
        int? currentUserId = null,
        CancellationToken cancellationToken = default)
    {
        var product = await PublicProductQuery()
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        return await MapToResponseAsync(product, currentUserId, true, cancellationToken);
    }

    public async Task<ProductResponse> UpdateAsync(
        int id,
        ProductUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .Include(p => p.ProductCategories)
            .Include(p => p.Variants)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);
        await ValidateBrandAsync(request.BrandId, cancellationToken);
        var categoryIds = await ValidateCategoriesAsync(request.CategoryIds, cancellationToken);
        ValidateVariants(request.Variants.Select(v => (v.Size, v.Color)));

        product.BrandId = request.BrandId;
        product.Name = request.Name.Trim();
        product.Slug = GenerateSlug(request.Name);
        product.Description = request.Description?.Trim();
        product.Price1Day = request.Price1Day;
        product.Price3Day = request.Price3Day;
        product.ExtraDayPrice = request.ExtraDayPrice;
        product.PriceTag = request.PriceTag;
        product.PriceDeposit = request.PriceDeposit;
        product.PurchaseCost = request.PurchaseCost;
        product.CleaningCost = request.CleaningCost;
        product.MaintenanceCost = request.MaintenanceCost;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        _dbContext.ProductCategories.RemoveRange(product.ProductCategories);
        product.ProductCategories = categoryIds
            .Select(categoryId => new ProductCategory
            {
                ProductId = product.Id,
                CategoryId = categoryId
            })
            .ToList();

        foreach (var variantRequest in request.Variants)
        {
            if (variantRequest.Id.HasValue)
            {
                var variant = product.Variants.FirstOrDefault(v => v.Id == variantRequest.Id.Value);
                if (variant == null)
                {
                    throw new ApiException(
                        ErrorCodes.BadRequest,
                        $"Variant {variantRequest.Id.Value} does not belong to this product.",
                        StatusCodes.Status400BadRequest);
                }

                variant.Size = variantRequest.Size.Trim();
                variant.Color = variantRequest.Color.Trim();
                variant.VariantCode = GenerateVariantCode(product.Id, variant.Size, variant.Color);
                variant.IsActive = variantRequest.IsActive;
                variant.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                var newVariant = new ProductVariant
                {
                    ProductId = product.Id,
                    Size = variantRequest.Size.Trim(),
                    Color = variantRequest.Color.Trim(),
                    IsActive = variantRequest.IsActive,
                    CreatedAt = DateTime.UtcNow
                };

                newVariant.VariantCode = GenerateVariantCode(product.Id, newVariant.Size, newVariant.Color);
                product.Variants.Add(newVariant);
            }
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<ProductResponse> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetManagementProductAsync(product.Id, currentUserId, cancellationToken);
    }

    public async Task<List<ProductImageResponse>> GetImagesAsync(
        int productId,
        CancellationToken cancellationToken = default)
    {
        await EnsurePublicProductExistsAsync(productId, cancellationToken);

        return await _dbContext.ProductImages
            .AsNoTracking()
            .Where(i => i.ProductId == productId)
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(i => MapImage(i))
            .ToListAsync(cancellationToken);
    }

    public async Task<ProductImageResponse> AddImageAsync(
        int productId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        if (request.IsPrimary)
        {
            await ClearPrimaryImageAsync(productId, null, cancellationToken);
        }

        var image = new ProductImage
        {
            ProductId = productId,
            ImageUrl = request.ImageUrl.Trim(),
            IsPrimary = request.IsPrimary,
            SortOrder = request.SortOrder,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProductImages.Add(image);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapImage(image);
    }

    public async Task<ProductImageResponse> UpdateImageAsync(
        int productId,
        int imageId,
        ProductImageRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var image = await _dbContext.ProductImages
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.Id == imageId, cancellationToken);

        if (image == null)
        {
            throw new ApiException(
                ErrorCodes.NotFound,
                "Product image not found.",
                StatusCodes.Status404NotFound);
        }

        if (request.IsPrimary)
        {
            await ClearPrimaryImageAsync(productId, imageId, cancellationToken);
        }

        image.ImageUrl = request.ImageUrl.Trim();
        image.IsPrimary = request.IsPrimary;
        image.SortOrder = request.SortOrder;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return MapImage(image);
    }

    public async Task<bool> DeleteImageAsync(
        int productId,
        int imageId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await GetProductForManagementAsync(productId, cancellationToken);
        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var image = await _dbContext.ProductImages
            .FirstOrDefaultAsync(i => i.ProductId == productId && i.Id == imageId, cancellationToken);

        if (image == null)
        {
            return false;
        }

        _dbContext.ProductImages.Remove(image);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    public async Task<ProductResponse> FavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        await EnsurePublicProductExistsAsync(productId, cancellationToken);

        var exists = await _dbContext.ProductLikes
            .AnyAsync(l => l.ProductId == productId && l.UserId == currentUserId, cancellationToken);

        if (!exists)
        {
            _dbContext.ProductLikes.Add(new ProductLike
            {
                ProductId = productId,
                UserId = currentUserId,
                CreatedAt = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(productId, currentUserId, cancellationToken);
    }

    public async Task<ProductResponse> UnfavoriteAsync(
        int productId,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        var like = await _dbContext.ProductLikes
            .FirstOrDefaultAsync(l => l.ProductId == productId && l.UserId == currentUserId, cancellationToken);

        if (like != null)
        {
            _dbContext.ProductLikes.Remove(like);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return await GetByIdAsync(productId, currentUserId, cancellationToken);
    }

    public async Task<PagedResponse<ProductResponse>> GetFavoritesAsync(
        ProductQueryRequest request,
        int currentUserId,
        CancellationToken cancellationToken = default)
    {
        return await GetPublicProductsAsync(request, currentUserId, currentUserId, cancellationToken);
    }

    private async Task<PagedResponse<ProductResponse>> GetPublicProductsAsync(
        ProductQueryRequest request,
        int? currentUserId,
        int? favoritedByUserId,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize <= 0 ? 20 : request.PageSize, 1, 100);
        var query = ApplyFilters(PublicProductQuery(), request);

        if (favoritedByUserId.HasValue)
        {
            query = query.Where(p => _dbContext.ProductLikes
                .Any(l => l.ProductId == p.Id && l.UserId == favoritedByUserId.Value));
        }

        query = ApplySort(query, request.SortBy, request.SortDirection);

        var totalItems = await query.CountAsync(cancellationToken);
        var products = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = new List<ProductResponse>();
        foreach (var product in products)
        {
            items.Add(await MapToResponseAsync(product, currentUserId, true, cancellationToken));
        }

        return new PagedResponse<ProductResponse>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize)
        };
    }

    private IQueryable<Product> PublicProductQuery()
    {
        return _dbContext.Products
            .AsNoTracking()
            .Where(p => p.IsActive && p.Shop != null && p.Shop.IsActive)
            .Include(p => p.Shop)
            .Include(p => p.Brand)
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
                .ThenInclude(v => v.InventoryItems)
            .AsSplitQuery();
    }

    private static IQueryable<Product> ApplyFilters(
        IQueryable<Product> query,
        ProductQueryRequest request)
    {
        var search = request.Search?.Trim();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(p =>
                p.Name.Contains(search) ||
                (p.Description != null && p.Description.Contains(search)) ||
                (p.Brand != null && p.Brand.Name.Contains(search)) ||
                p.ProductCategories.Any(pc => pc.Category.Name.Contains(search)));
        }

        var categoryIds = request.CategoryIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (categoryIds.Count > 0)
        {
            query = query.Where(p => p.ProductCategories.Any(pc => categoryIds.Contains(pc.CategoryId)));
        }

        if (request.BrandId.HasValue)
        {
            query = query.Where(p => p.BrandId == request.BrandId.Value);
        }

        if (request.ShopId.HasValue)
        {
            query = query.Where(p => p.ShopId == request.ShopId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Size))
        {
            var size = request.Size.Trim();
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Size == size));
        }

        if (!string.IsNullOrWhiteSpace(request.Color))
        {
            var color = request.Color.Trim();
            query = query.Where(p => p.Variants.Any(v => v.IsActive && v.Color == color));
        }

        if (!string.IsNullOrWhiteSpace(request.Condition))
        {
            var condition = request.Condition.Trim().ToUpperInvariant();
            query = query.Where(p => p.Variants.Any(v => v.IsActive &&
                v.InventoryItems.Any(i => i.Condition == condition)));
        }

        if (request.MinPrice.HasValue)
        {
            query = query.Where(p => p.Price1Day >= request.MinPrice.Value);
        }

        if (request.MaxPrice.HasValue)
        {
            query = query.Where(p => p.Price1Day <= request.MaxPrice.Value);
        }

        if (request.InStock == true)
        {
            query = query.Where(p => p.Variants.Any(v => v.IsActive &&
                v.InventoryItems.Any(i => i.Status == AvailableInventoryStatus)));
        }

        return query;
    }

    private static IQueryable<Product> ApplySort(
        IQueryable<Product> query,
        string? sortBy,
        string? sortDirection)
    {
        var descending = !string.Equals(sortDirection, "asc", StringComparison.OrdinalIgnoreCase);

        return (sortBy ?? "createdAt").Trim().ToLowerInvariant() switch
        {
            "name" => descending
                ? query.OrderByDescending(p => p.Name).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Name).ThenBy(p => p.Id),
            "price1day" => descending
                ? query.OrderByDescending(p => p.Price1Day).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.Price1Day).ThenBy(p => p.Id),
            _ => descending
                ? query.OrderByDescending(p => p.CreatedAt).ThenByDescending(p => p.Id)
                : query.OrderBy(p => p.CreatedAt).ThenBy(p => p.Id)
        };
    }

    private async Task<ProductResponse> GetManagementProductAsync(
        int id,
        int? currentUserId,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.Shop)
            .Include(p => p.Brand)
            .Include(p => p.ProductCategories)
                .ThenInclude(pc => pc.Category)
            .Include(p => p.Images)
            .Include(p => p.Variants)
                .ThenInclude(v => v.InventoryItems)
            .AsSplitQuery()
            .FirstAsync(p => p.Id == id, cancellationToken);

        return await MapToResponseAsync(product, currentUserId, false, cancellationToken);
    }

    private async Task<ProductResponse> MapToResponseAsync(
        Product product,
        int? currentUserId,
        bool publicCatalog,
        CancellationToken cancellationToken)
    {
        var variants = publicCatalog
            ? product.Variants.Where(v => v.IsActive)
            : product.Variants;

        var variantResponses = variants
            .OrderBy(v => v.Size)
            .ThenBy(v => v.Color)
            .Select(v => MapVariant(v, product))
            .ToList();

        var images = product.Images
            .OrderByDescending(i => i.IsPrimary)
            .ThenBy(i => i.SortOrder)
            .ThenBy(i => i.Id)
            .Select(MapImage)
            .ToList();

        var likeCount = await _dbContext.ProductLikes
            .AsNoTracking()
            .CountAsync(l => l.ProductId == product.Id, cancellationToken);

        var isFavorited = currentUserId.HasValue &&
            await _dbContext.ProductLikes
                .AsNoTracking()
                .AnyAsync(l => l.ProductId == product.Id && l.UserId == currentUserId.Value, cancellationToken);

        return new ProductResponse
        {
            Id = product.Id,
            ShopId = product.ShopId ?? 0,
            BrandId = product.BrandId,
            BrandName = product.Brand?.Name,
            BrandSlug = product.Brand?.Slug,
            ShopName = product.Shop?.Name,
            Name = product.Name,
            Slug = product.Slug,
            Description = product.Description,
            Price1Day = product.Price1Day,
            Price3Day = product.Price3Day,
            ExtraDayPrice = product.ExtraDayPrice,
            PriceTag = product.PriceTag,
            PriceDeposit = product.PriceDeposit,
            PurchaseCost = publicCatalog ? null : product.PurchaseCost,
            CleaningCost = publicCatalog ? 0 : product.CleaningCost,
            MaintenanceCost = publicCatalog ? 0 : product.MaintenanceCost,
            IsActive = product.IsActive,
            CreatedAt = product.CreatedAt,
            UpdatedAt = product.UpdatedAt,
            Categories = product.ProductCategories
                .OrderBy(pc => pc.Category.Name)
                .Select(pc => new ProductCategoryResponse
                {
                    Id = pc.Category.Id,
                    Name = pc.Category.Name,
                    Slug = pc.Category.Slug
                })
                .ToList(),
            Variants = variantResponses,
            Images = images,
            PrimaryImage = images.FirstOrDefault(i => i.IsPrimary) ?? images.FirstOrDefault(),
            TotalStock = variantResponses.Sum(v => v.TotalStock),
            AvailableStock = variantResponses.Sum(v => v.AvailableStock),
            Conditions = variantResponses
                .SelectMany(v => v.Conditions)
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(c => c)
                .ToList(),
            LikeCount = likeCount,
            IsFavorited = isFavorited
        };
    }

    private static ProductVariantResponse MapVariant(ProductVariant variant, Product product)
    {
        var inventoryItems = variant.InventoryItems.ToList();

        return new ProductVariantResponse
        {
            Id = variant.Id,
            Size = variant.Size,
            Color = variant.Color,
            VariantCode = variant.VariantCode,
            IsActive = variant.IsActive,
            TotalStock = inventoryItems.Count,
            AvailableStock = inventoryItems.Count(i => i.Status == AvailableInventoryStatus),
            Conditions = inventoryItems
                .Select(i => i.Condition)
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(c => c)
                .ToList(),
            Price = new ProductVariantPriceResponse
            {
                Price1Day = product.Price1Day,
                Price3Day = product.Price3Day,
                ExtraDayPrice = product.ExtraDayPrice,
                PriceDeposit = product.PriceDeposit
            }
        };
    }

    private static ProductImageResponse MapImage(ProductImage image)
    {
        return new ProductImageResponse
        {
            Id = image.Id,
            ImageUrl = image.ImageUrl,
            IsPrimary = image.IsPrimary,
            SortOrder = image.SortOrder,
            CreatedAt = image.CreatedAt
        };
    }

    private async Task<Product> GetProductForManagementAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products
            .Include(p => p.Shop)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        return product;
    }

    private async Task EnsurePublicProductExistsAsync(
        int productId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.Products
            .AsNoTracking()
            .AnyAsync(p => p.Id == productId && p.IsActive && p.Shop != null && p.Shop.IsActive, cancellationToken);

        if (!exists)
        {
            throw ProductNotFound();
        }
    }

    private async Task EnsureCanManageShopAsync(
        int shopId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken)
    {
        var shop = await _dbContext.Shops
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == shopId && s.IsActive, cancellationToken);

        if (shop == null)
        {
            throw new ApiException(
                ErrorCodes.ShopNotFound,
                "Shop does not exist or is inactive.",
                StatusCodes.Status404NotFound);
        }

        if (IsAdmin(currentUserRole) || IsLenderOwner(currentUserRole, currentUserId, shop.OwnerUserId))
        {
            return;
        }

        throw Forbidden();
    }

    private static void EnsureCanManageProduct(
        Product product,
        int currentUserId,
        string currentUserRole)
    {
        if (IsAdmin(currentUserRole) ||
            (product.Shop != null && IsLenderOwner(currentUserRole, currentUserId, product.Shop.OwnerUserId)))
        {
            return;
        }

        throw Forbidden();
    }

    private async Task ValidateBrandAsync(
        int? brandId,
        CancellationToken cancellationToken)
    {
        if (!brandId.HasValue)
        {
            return;
        }

        var brandExists = await _dbContext.Brands
            .AnyAsync(b => b.Id == brandId.Value && b.IsActive, cancellationToken);

        if (!brandExists)
        {
            throw new ApiException(
                ErrorCodes.BrandNotFound,
                "Brand does not exist or is inactive.",
                StatusCodes.Status404NotFound);
        }
    }

    private async Task<List<int>> ValidateCategoriesAsync(
        IEnumerable<int> requestCategoryIds,
        CancellationToken cancellationToken)
    {
        var categoryIds = requestCategoryIds
            .Where(id => id > 0)
            .Distinct()
            .ToList();

        if (categoryIds.Count == 0)
        {
            throw new ApiException(
                ErrorCodes.ValidationError,
                "At least one category is required.",
                StatusCodes.Status400BadRequest);
        }

        var existingCategoryIds = await _dbContext.Categories
            .Where(c => categoryIds.Contains(c.Id) && c.IsActive)
            .Select(c => c.Id)
            .ToListAsync(cancellationToken);

        if (existingCategoryIds.Count != categoryIds.Count)
        {
            throw new ApiException(
                ErrorCodes.CategoryNotFound,
                "One or more categories do not exist or are inactive.",
                StatusCodes.Status404NotFound);
        }

        return categoryIds;
    }

    private static void ValidateVariants(
        IEnumerable<(string Size, string Color)> variants)
    {
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var variant in variants)
        {
            if (string.IsNullOrWhiteSpace(variant.Size) || string.IsNullOrWhiteSpace(variant.Color))
            {
                throw new ApiException(
                    ErrorCodes.ValidationError,
                    "Variant size and color are required.",
                    StatusCodes.Status400BadRequest);
            }

            var key = $"{variant.Size.Trim()}|{variant.Color.Trim()}";
            if (!seen.Add(key))
            {
                throw new ApiException(
                    ErrorCodes.BadRequest,
                    "Duplicate variants are not allowed.",
                    StatusCodes.Status400BadRequest);
            }
        }
    }

    private async Task ClearPrimaryImageAsync(
        int productId,
        int? exceptImageId,
        CancellationToken cancellationToken)
    {
        var primaryImages = await _dbContext.ProductImages
            .Where(i => i.ProductId == productId && i.IsPrimary && i.Id != exceptImageId)
            .ToListAsync(cancellationToken);

        foreach (var image in primaryImages)
        {
            image.IsPrimary = false;
        }
    }

    private static bool IsAdmin(string role)
    {
        return string.Equals(role, AdminRole, StringComparison.OrdinalIgnoreCase);
    }

    private static bool IsLenderOwner(string role, int currentUserId, int ownerUserId)
    {
        return string.Equals(role, LenderRole, StringComparison.OrdinalIgnoreCase) &&
            currentUserId == ownerUserId;
    }

    private static ApiException Forbidden()
    {
        return new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to manage this product.",
            StatusCodes.Status403Forbidden);
    }

    private static ApiException ProductNotFound()
    {
        return new ApiException(
            ErrorCodes.ProductNotFound,
            "Product not found.",
            StatusCodes.Status404NotFound);
    }

    private static string GenerateVariantCode(
        int productId,
        string size,
        string color)
    {
        var cleanSize = size.Trim().ToUpperInvariant().Replace(" ", "-");
        var cleanColor = color.Trim().ToUpperInvariant().Replace(" ", "-");

        return $"PRD{productId}-{cleanSize}-{cleanColor}";
    }

    private static string GenerateSlug(string name)
    {
        return name.Trim().ToLowerInvariant().Replace(" ", "-");
    }
}
```

## `backend/DoRentMe.Api/Services/BrandService.cs`

```csharp
using DoRentMe.Api.Contracts.Brand;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;
using DoRentMe.Api.Common.Exceptions;
using Microsoft.AspNetCore.Http;

namespace DoRentMe.Api.Services;

public class BrandService : IBrandService
{
    private readonly DoRentMeDbContext _dbContext;

    public BrandService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Brand> CreateAsync(
        BrandRequests request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Brands
            .AnyAsync(
                b => b.Name == name || b.Slug == slug,
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "BRAND_ALREADY_EXISTS",
                message: "Brand already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var brand = new Brand
        {
            Name = name,
            Slug = slug
        };

        _dbContext.Brands.Add(brand);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return brand;
    }

    public async Task<List<Brand>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Brands
            .AsNoTracking()
            .Where(b => b.IsActive)
            .OrderBy(b => b.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<Brand?> GetByIdAsync(
    int id,
    CancellationToken cancellationToken)
    {
        return await _dbContext.Brands
            .AsNoTracking()
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);
    }

    public async Task<Brand> UpdateAsync(
    int id,
    UpdateBrandRequest request,
    CancellationToken cancellationToken)
    {
        var brand = await _dbContext.Brands
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        var name = request.Name.Trim();
        var slug = GenerateSlug(name);

        var exists = await _dbContext.Brands
            .AnyAsync(
                b => b.Id != id &&
                     (b.Name == name || b.Slug == slug),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                "BRAND_ALREADY_EXISTS",
                "Brand already exists.",
                StatusCodes.Status400BadRequest);
        }

        brand.Name = name;
        brand.Slug = slug;
        brand.IsActive = request.IsActive;
        brand.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return brand;
    }

    public async Task DeleteAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var brand = await _dbContext.Brands
            .FirstOrDefaultAsync(
                b => b.Id == id,
                cancellationToken);

        if (brand == null)
        {
            throw new ApiException(
                "BRAND_NOT_FOUND",
                "Brand not found.",
                StatusCodes.Status404NotFound);
        }

        _dbContext.Brands.Remove(brand);

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
    
    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}
```

## `backend/DoRentMe.Api/Services/CategoryService.cs`

```csharp
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Category;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class CategoryService : ICategoryService
{
    private readonly DoRentMeDbContext _dbContext;

    public CategoryService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<CategoryReadResponse>> GetAllAsync(
        CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.IsActive)
            .OrderBy(c => c.Id)
            .Select(c => new CategoryReadResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<CategoryReadResponse?> GetByIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        return await _dbContext.Categories
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoryReadResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                IsActive = c.IsActive,
                CreatedAt = c.CreatedAt,
                UpdatedAt = c.UpdatedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CategoryReadResponse> CreateAsync(
        CategoryCreateRequest request,
        CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Categories
            .AnyAsync(
                c => c.Name == name || c.Slug == slug,
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "CATEGORY_ALREADY_EXISTS",
                message: "Category already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        var category = new Category
        {
            Name = name,
            Slug = slug,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.Categories.Add(category);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<CategoryReadResponse?> UpdateAsync(
        int id,
        CategoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(
                c => c.Id == id,
                cancellationToken);

        if (category == null)
        {
            return null;
        }

        var name = request.Name.Trim();

        var slug = GenerateSlug(name);

        var exists = await _dbContext.Categories
            .AnyAsync(
                c =>
                    c.Id != id &&
                    (c.Name == name || c.Slug == slug),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                code: "CATEGORY_ALREADY_EXISTS",
                message: "Category already exists.",
                statusCode: StatusCodes.Status400BadRequest);
        }

        category.Name = name;
        category.Slug = slug;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return ToResponse(category);
    }

    public async Task<bool> DeleteAsync(
        int id,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .FirstOrDefaultAsync(
                c => c.Id == id,
                cancellationToken);

        if (category == null)
        {
            return false;
        }

        var hasProducts = await _dbContext.ProductCategories
    .AnyAsync(
        pc => pc.CategoryId == id,
        cancellationToken);

        if (hasProducts)
        {
            throw new ApiException(
                code: "CATEGORY_IN_USE",
                message: "Category is being used by products.",
                statusCode: StatusCodes.Status409Conflict);
        }

        _dbContext.Categories.Remove(category);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private static CategoryReadResponse ToResponse(
        Category category)
    {
        return new CategoryReadResponse
        {
            Id = category.Id,
            Name = category.Name,
            Slug = category.Slug,
            IsActive = category.IsActive,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    private static string GenerateSlug(string name)
    {
        return name
            .Trim()
            .ToLowerInvariant()
            .Replace(" ", "-");
    }
}
```

## `backend/DoRentMe.Api/Services/ShopService.cs`

```csharp
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Shop;
using DoRentMe.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class ShopService : IShopService
{
    private readonly DoRentMeDbContext _dbContext;

    public ShopService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<ShopReadResponse>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Shops
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .Select(s => new ShopReadResponse
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email,
                Ward = s.Ward,
                District = s.District,
                City = s.City
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<ShopReadResponse> GetByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        var shop = await _dbContext.Shops
            .AsNoTracking()
            .Where(s => s.Id == id && s.IsActive)
            .Select(s => new ShopReadResponse
            {
                Id = s.Id,
                Name = s.Name,
                Email = s.Email,
                Ward = s.Ward,
                District = s.District,
                City = s.City
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (shop == null)
        {
            throw new ApiException(
                ErrorCodes.ShopNotFound,
                "Shop not found.",
                StatusCodes.Status404NotFound);
        }

        return shop;
    }
}
```

## `backend/DoRentMe.Api/Services/InventoryService.cs`

```csharp
using DoRentMe.Api.Common.Errors;
using DoRentMe.Api.Common.Exceptions;
using DoRentMe.Api.Contracts.Inventory;
using DoRentMe.Api.Data;
using DoRentMe.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DoRentMe.Api.Services;

public class InventoryService : IInventoryService
{
    private const string AdminRole = "ADMIN";
    private const string LenderRole = "LENDER";
    private const string AvailableStatus = "AVAILABLE";

    private static readonly string[] ValidConditions = ["NEW", "GOOD", "FAIR", "WORN", "DAMAGED"];
    private static readonly string[] ValidStatuses =
    [
        "AVAILABLE",
        "RESERVED",
        "RENTED",
        "CLEANING",
        "MAINTENANCE",
        "DAMAGED",
        "LOST",
        "RETIRED"
    ];

    private readonly DoRentMeDbContext _dbContext;

    public InventoryService(DoRentMeDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IReadOnlyList<InventoryResponse>> GetAllAsync(
        InventoryQueryRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var query = ApplyManagementScope(InventoryQuery(), currentUserId, currentUserRole);

        if (request.ProductId.HasValue)
        {
            query = query.Where(item => item.ProductVariant.ProductId == request.ProductId.Value);
        }

        if (request.VariantId.HasValue)
        {
            query = query.Where(item => item.ProductVariantId == request.VariantId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            var status = NormalizeStatus(request.Status);
            EnsureValidStatus(status);
            query = query.Where(item => item.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(request.Condition))
        {
            var condition = NormalizeCondition(request.Condition);
            EnsureValidCondition(condition);
            query = query.Where(item => item.Condition == condition);
        }

        var items = await query
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);

        return items.Select(MapInventory).ToList();
    }

    public async Task<InventoryResponse> GetByIdAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        return MapInventory(item);
    }

    public async Task<IReadOnlyList<InventoryResponse>> GetByProductAsync(
        int productId,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(product => product.Shop)
            .FirstOrDefaultAsync(product => product.Id == productId, cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(product, currentUserId, currentUserRole);

        var items = await InventoryQuery()
            .Where(item => item.ProductVariant.ProductId == productId)
            .OrderByDescending(item => item.CreatedAt)
            .ThenByDescending(item => item.Id)
            .ToListAsync(cancellationToken);

        return items.Select(MapInventory).ToList();
    }

    public async Task<ProductAvailabilityResponse> GetProductAvailabilityAsync(
        int productId,
        DateOnly? startDate,
        DateOnly? endDate,
        CancellationToken cancellationToken = default)
    {
        if (!startDate.HasValue || !endDate.HasValue)
        {
            throw new ApiException(
                ErrorCodes.InvalidRentalPeriod,
                "StartDate and EndDate are required.",
                StatusCodes.Status400BadRequest);
        }

        RentalAvailabilityRules.ValidateRentalPeriod(startDate.Value, endDate.Value);

        var product = await _dbContext.Products
            .AsNoTracking()
            .Include(p => p.Shop)
            .Include(p => p.Variants.Where(variant => variant.IsActive))
                .ThenInclude(variant => variant.InventoryItems)
            .AsSplitQuery()
            .FirstOrDefaultAsync(
                p => p.Id == productId && p.IsActive && p.Shop != null && p.Shop.IsActive,
                cancellationToken);

        if (product == null)
        {
            throw ProductNotFound();
        }

        var rentableInventoryIds = product.Variants
            .SelectMany(variant => variant.InventoryItems)
            .Where(item => RentalAvailabilityRules.RentableInventoryStatuses.Contains(item.Status))
            .Select(item => item.Id)
            .ToArray();

        var blockedInventoryIds = rentableInventoryIds.Length == 0
            ? new HashSet<int>()
            : (await _dbContext.RentalReservations
                .AsNoTracking()
                .Where(reservation => rentableInventoryIds.Contains(reservation.ProductInventoryItemId))
                .WhereBlocking()
                .WhereOverlaps(startDate.Value, endDate.Value)
                .Select(reservation => reservation.ProductInventoryItemId)
                .ToListAsync(cancellationToken))
                .ToHashSet();

        return new ProductAvailabilityResponse
        {
            ProductId = product.Id,
            StartDate = startDate.Value,
            EndDate = endDate.Value,
            Variants = product.Variants
                .OrderBy(variant => variant.Size)
                .ThenBy(variant => variant.Color)
                .Select(variant =>
                {
                    var rentableItems = variant.InventoryItems
                        .Where(item => RentalAvailabilityRules.RentableInventoryStatuses.Contains(item.Status))
                        .ToList();
                    var availableInventory = rentableItems.Count(item => !blockedInventoryIds.Contains(item.Id));

                    return new ProductVariantAvailabilityResponse
                    {
                        VariantId = variant.Id,
                        Size = variant.Size,
                        Color = variant.Color,
                        VariantCode = variant.VariantCode,
                        TotalInventory = variant.InventoryItems.Count,
                        AvailableInventory = availableInventory,
                        IsAvailable = availableInventory > 0
                    };
                })
                .ToList()
        };
    }

    public async Task<InventoryResponse> CreateAsync(
        int productId,
        int variantId,
        InventoryCreateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var productExists = await _dbContext.Products
            .AsNoTracking()
            .AnyAsync(product => product.Id == productId, cancellationToken);

        if (!productExists)
        {
            throw ProductNotFound();
        }

        var variant = await _dbContext.ProductVariants
            .Include(v => v.Product)
                .ThenInclude(p => p.Shop)
            .FirstOrDefaultAsync(v => v.Id == variantId, cancellationToken);

        if (variant == null)
        {
            throw VariantNotFound();
        }

        if (variant.ProductId != productId)
        {
            throw ProductVariantMismatch();
        }

        if (variant.Product == null)
        {
            throw ProductNotFound();
        }

        EnsureCanManageProduct(variant.Product, currentUserId, currentUserRole);

        var assetCode = NormalizeRequired(request.AssetCode);
        var condition = NormalizeCondition(request.Condition);
        EnsureValidCondition(condition);
        await EnsureUniqueAssetCodeAsync(assetCode, null, cancellationToken);

        var item = new ProductInventoryItem
        {
            ProductVariantId = variant.Id,
            AssetCode = assetCode,
            Condition = condition,
            Status = AvailableStatus,
            Notes = NormalizeOptional(request.Notes),
            AcquiredAt = request.AcquiredAt,
            CreatedAt = DateTime.UtcNow
        };

        _dbContext.ProductInventoryItems.Add(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<InventoryResponse> UpdateAsync(
        int id,
        InventoryUpdateRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var assetCode = NormalizeRequired(request.AssetCode);
        var condition = NormalizeCondition(request.Condition);
        EnsureValidCondition(condition);
        await EnsureUniqueAssetCodeAsync(assetCode, item.Id, cancellationToken);

        item.AssetCode = assetCode;
        item.Condition = condition;
        item.Notes = NormalizeOptional(request.Notes);
        item.AcquiredAt = request.AcquiredAt;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<InventoryResponse> UpdateStatusAsync(
        int id,
        InventoryStatusRequest request,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            throw InventoryNotFound();
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var status = NormalizeStatus(request.Status);
        EnsureValidStatus(status);

        item.Status = status;
        item.UpdatedAt = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return await GetByIdAsync(item.Id, currentUserId, currentUserRole, cancellationToken);
    }

    public async Task<bool> DeleteAsync(
        int id,
        int currentUserId,
        string currentUserRole,
        CancellationToken cancellationToken = default)
    {
        var item = await InventoryForManagementQuery()
            .FirstOrDefaultAsync(item => item.Id == id, cancellationToken);

        if (item == null)
        {
            return false;
        }

        EnsureCanManageProduct(item.ProductVariant.Product, currentUserId, currentUserRole);

        var hasRentalHistory = await _dbContext.RentalReservations
            .AnyAsync(reservation => reservation.ProductInventoryItemId == item.Id, cancellationToken);

        if (hasRentalHistory)
        {
            throw new ApiException(
                ErrorCodes.InventoryHasRentalHistory,
                "Inventory item has rental history and cannot be deleted. Retire it instead.",
                StatusCodes.Status409Conflict);
        }

        _dbContext.ProductInventoryItems.Remove(item);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return true;
    }

    private IQueryable<ProductInventoryItem> InventoryQuery()
    {
        return _dbContext.ProductInventoryItems
            .AsNoTracking()
            .Include(item => item.ProductVariant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Shop);
    }

    private IQueryable<ProductInventoryItem> InventoryForManagementQuery()
    {
        return _dbContext.ProductInventoryItems
            .Include(item => item.ProductVariant)
                .ThenInclude(variant => variant.Product)
                    .ThenInclude(product => product.Shop);
    }

    private static InventoryResponse MapInventory(ProductInventoryItem item)
    {
        return new InventoryResponse
        {
            Id = item.Id,
            ProductId = item.ProductVariant.ProductId,
            ProductName = item.ProductVariant.Product.Name,
            ProductVariantId = item.ProductVariantId,
            Size = item.ProductVariant.Size,
            Color = item.ProductVariant.Color,
            VariantCode = item.ProductVariant.VariantCode,
            AssetCode = item.AssetCode,
            Condition = item.Condition,
            Status = item.Status,
            Notes = item.Notes,
            AcquiredAt = item.AcquiredAt,
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static IQueryable<ProductInventoryItem> ApplyManagementScope(
        IQueryable<ProductInventoryItem> query,
        int currentUserId,
        string currentUserRole)
    {
        if (string.Equals(currentUserRole, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return query;
        }

        if (string.Equals(currentUserRole, LenderRole, StringComparison.OrdinalIgnoreCase))
        {
            return query.Where(item => item.ProductVariant.Product.Shop != null
                && item.ProductVariant.Product.Shop.OwnerUserId == currentUserId);
        }

        throw new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to view inventory.",
            StatusCodes.Status403Forbidden);
    }

    private async Task EnsureUniqueAssetCodeAsync(
        string assetCode,
        int? currentInventoryItemId,
        CancellationToken cancellationToken)
    {
        var exists = await _dbContext.ProductInventoryItems
            .AnyAsync(
                item => item.AssetCode == assetCode
                    && (!currentInventoryItemId.HasValue || item.Id != currentInventoryItemId.Value),
                cancellationToken);

        if (exists)
        {
            throw new ApiException(
                ErrorCodes.DuplicateAssetCode,
                "AssetCode already exists.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static void EnsureCanManageProduct(
        Product product,
        int currentUserId,
        string currentUserRole)
    {
        if (string.Equals(currentUserRole, AdminRole, StringComparison.OrdinalIgnoreCase))
        {
            return;
        }

        if (string.Equals(currentUserRole, LenderRole, StringComparison.OrdinalIgnoreCase)
            && product.Shop?.OwnerUserId == currentUserId)
        {
            return;
        }

        throw new ApiException(
            ErrorCodes.Forbidden,
            "You are not allowed to manage this inventory item.",
            StatusCodes.Status403Forbidden);
    }

    private static void EnsureValidCondition(string condition)
    {
        if (!ValidConditions.Contains(condition, StringComparer.OrdinalIgnoreCase))
        {
            throw new ApiException(
                ErrorCodes.InvalidInventoryCondition,
                "Inventory condition is not supported.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static void EnsureValidStatus(string status)
    {
        if (!ValidStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
        {
            throw new ApiException(
                ErrorCodes.InvalidInventoryStatus,
                "Inventory status is not supported.",
                StatusCodes.Status400BadRequest);
        }
    }

    private static string NormalizeRequired(string value)
    {
        var trimmed = value.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            throw new ApiException(
                ErrorCodes.ValidationError,
                "Required inventory value cannot be empty.",
                StatusCodes.Status400BadRequest);
        }

        return trimmed;
    }

    private static string? NormalizeOptional(string? value)
    {
        var trimmed = value?.Trim();
        return string.IsNullOrWhiteSpace(trimmed) ? null : trimmed;
    }

    private static string NormalizeCondition(string condition)
    {
        return NormalizeRequired(condition).ToUpperInvariant();
    }

    private static string NormalizeStatus(string status)
    {
        return NormalizeRequired(status).ToUpperInvariant();
    }

    private static ApiException InventoryNotFound()
    {
        return new ApiException(
            ErrorCodes.InventoryItemNotFound,
            "Inventory item not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException ProductNotFound()
    {
        return new ApiException(
            ErrorCodes.ProductNotFound,
            "Product not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException VariantNotFound()
    {
        return new ApiException(
            ErrorCodes.VariantNotFound,
            "Product variant not found.",
            StatusCodes.Status404NotFound);
    }

    private static ApiException ProductVariantMismatch()
    {
        return new ApiException(
            ErrorCodes.ProductVariantMismatch,
            "Product variant does not belong to the specified product.",
            StatusCodes.Status400BadRequest);
    }
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductQueryRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductQueryRequest
{
    public string? Search { get; set; }

    public List<int> CategoryIds { get; set; } = new();

    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [Range(1, int.MaxValue)]
    public int? ShopId { get; set; }

    public string? Size { get; set; }

    public string? Color { get; set; }

    public string? Condition { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? MinPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? MaxPrice { get; set; }

    public bool? InStock { get; set; }

    public string? SortBy { get; set; } = "createdAt";

    public string? SortDirection { get; set; } = "desc";

    [Range(1, int.MaxValue)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 20;
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Product;

public class ProductResponse
{
    public int Id { get; set; }

    public int ShopId { get; set; }

    public int? BrandId { get; set; }

    public string? BrandName { get; set; }

    public string? BrandSlug { get; set; }

    public string? ShopName { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public string? Description { get; set; }

    public decimal Price1Day { get; set; }

    public decimal Price3Day { get; set; }

    public decimal ExtraDayPrice { get; set; }

    public decimal? PriceTag { get; set; }

    public decimal PriceDeposit { get; set; }

    public decimal? PurchaseCost { get; set; }

    public decimal CleaningCost { get; set; }

    public decimal MaintenanceCost { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public List<ProductCategoryResponse> Categories { get; set; } = new();

    public List<ProductVariantResponse> Variants { get; set; } = new();

    public List<ProductImageResponse> Images { get; set; } = new();

    public ProductImageResponse? PrimaryImage { get; set; }

    public int TotalStock { get; set; }

    public int AvailableStock { get; set; }

    public List<string> Conditions { get; set; } = new();

    public int LikeCount { get; set; }

    public bool IsFavorited { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductImageResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Product;

public class ProductImageResponse
{
    public int Id { get; set; }

    public string ImageUrl { get; set; } = null!;

    public bool IsPrimary { get; set; }

    public int SortOrder { get; set; }

    public DateTime CreatedAt { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductCategoryResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Product;

public class ProductCategoryResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductCreateRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductCreateRequest
{
    [Range(1, int.MaxValue, ErrorMessage = "ShopId must be greater than 0.")]
    public int ShopId { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "BrandId must be greater than 0.")]
    public int? BrandId { get; set; }

    [MinLength(1, ErrorMessage = "At least one category is required.")]
    public List<int> CategoryIds { get; set; } = new();

    [Required(ErrorMessage = "Product name is required.")]
    [MaxLength(200, ErrorMessage = "Product name cannot exceed 200 characters.")]
    public string Name { get; set; } = null!;

    [MaxLength(2000, ErrorMessage = "Description cannot exceed 2000 characters.")]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999",
        ErrorMessage = "Price1Day must be greater than 0.")]
    public decimal Price1Day { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999",
        ErrorMessage = "Price3Day must be greater than 0.")]
    public decimal Price3Day { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "ExtraDayPrice cannot be negative.")]
    public decimal ExtraDayPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PriceTag cannot be negative.")]
    public decimal? PriceTag { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PriceDeposit cannot be negative.")]
    public decimal PriceDeposit { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "PurchaseCost cannot be negative.")]
    public decimal? PurchaseCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "CleaningCost cannot be negative.")]
    public decimal CleaningCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999",
        ErrorMessage = "MaintenanceCost cannot be negative.")]
    public decimal MaintenanceCost { get; set; }

    public List<ProductVariantCreateRequest> Variants { get; set; } = new();
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductUpdateRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductUpdateRequest
{
    [Range(1, int.MaxValue)]
    public int? BrandId { get; set; }

    [MinLength(1, ErrorMessage = "At least one category is required.")]
    public List<int> CategoryIds { get; set; } = new();

    [Required(ErrorMessage = "Product name is required.")]
    [MaxLength(200)]
    public string Name { get; set; } = null!;

    [MaxLength(2000)]
    public string? Description { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999")]
    public decimal Price1Day { get; set; }

    [Range(typeof(decimal), "0.01", "999999999999")]
    public decimal Price3Day { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal ExtraDayPrice { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? PriceTag { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal PriceDeposit { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal? PurchaseCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal CleaningCost { get; set; }

    [Range(typeof(decimal), "0", "999999999999")]
    public decimal MaintenanceCost { get; set; }

    public bool IsActive { get; set; }

    public List<ProductVariantUpdateRequest> Variants { get; set; } = new();
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductVariantResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Product;

public class ProductVariantResponse
{
    public int Id { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public bool IsActive { get; set; }

    public int TotalStock { get; set; }

    public int AvailableStock { get; set; }

    public List<string> Conditions { get; set; } = new();

    public ProductVariantPriceResponse Price { get; set; } = new();
}

public class ProductVariantPriceResponse
{
    public decimal Price1Day { get; set; }

    public decimal Price3Day { get; set; }

    public decimal ExtraDayPrice { get; set; }

    public decimal PriceDeposit { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductVariantCreateRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductVariantCreateRequest
{
    [Required]
    [MaxLength(50)]
    public string Size { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Color { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Product/ProductVariantUpdateRequest.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Product;

public class ProductVariantUpdateRequest
{
    public int? Id { get; set; }

    [Required]
    [MaxLength(50)]
    public string Size { get; set; } = null!;

    [Required]
    [MaxLength(50)]
    public string Color { get; set; } = null!;

    public bool IsActive { get; set; } = true;
}
```

## `backend/DoRentMe.Api/Contracts/Brand/BrandResponses.cs`

```csharp
namespace DoRentMe.Api.Contracts.Brand;

public class BrandResponses
{
    public int Id { get; set; }

    public string Message { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Brand/BrandReadResponses.cs`

```csharp
namespace DoRentMe.Api.Contracts.Brand;

public class BrandReadResponses
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Brand/BrandRequests.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Brand;

public class BrandRequests
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Brand/BrandUpdateRequests.cs`

```csharp
using System.ComponentModel.DataAnnotations;

namespace DoRentMe.Api.Contracts.Brand;

public class UpdateBrandRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Category/CategoryReadResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Category;

public class CategoryReadResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string Slug { get; set; } = null!;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Category/CategoryResponses.cs`

```csharp
namespace DoRentMe.Api.Contracts.Category;

public class CategoryResponses
{
    public int Id { get; set; }

    public string Message { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Category/CategoryCreateRequest.cs`

```csharp
namespace DoRentMe.Api.Contracts.Category;

public class CategoryCreateRequest
{
    public string Name { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Contracts/Category/CategoryUpdateRequest.cs`

```csharp
namespace DoRentMe.Api.Contracts.Category;

public class CategoryUpdateRequest
{
    public string Name { get; set; } = null!;

    public bool IsActive { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Shop/ShopReadResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Shop;

public class ShopReadResponse
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Email { get; set; }

    public string? Ward { get; set; }

    public string? District { get; set; }

    public string? City { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Common/PagedResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Common;

public class PagedResponse<T>
{
    public List<T> Items { get; set; } = new();

    public int Page { get; set; }

    public int PageSize { get; set; }

    public int TotalItems { get; set; }

    public int TotalPages { get; set; }
}
```

## `backend/DoRentMe.Api/Contracts/Inventory/ProductAvailabilityResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Inventory;

public class ProductAvailabilityResponse
{
    public int ProductId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public List<ProductVariantAvailabilityResponse> Variants { get; set; } = new();
}
```

## `backend/DoRentMe.Api/Contracts/Inventory/ProductVariantAvailabilityResponse.cs`

```csharp
namespace DoRentMe.Api.Contracts.Inventory;

public class ProductVariantAvailabilityResponse
{
    public int VariantId { get; set; }

    public string Size { get; set; } = null!;

    public string Color { get; set; } = null!;

    public string? VariantCode { get; set; }

    public int TotalInventory { get; set; }

    public int AvailableInventory { get; set; }

    public bool IsAvailable { get; set; }
}
```

## `backend/DoRentMe.Api/Models/Product.cs`

```csharp
namespace DoRentMe.Api.Models;

public class Product
{
    public int Id { get; set; }
    public int? ShopId { get; set; }
    public int? BrandId { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price1Day { get; set; }
    public decimal Price3Day { get; set; }
    public decimal ExtraDayPrice { get; set; }
    public decimal? PriceTag { get; set; }
    public decimal PriceDeposit { get; set; }
    public decimal? PurchaseCost { get; set; }
    public decimal CleaningCost { get; set; }
    public decimal MaintenanceCost { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Shop? Shop { get; set; }
    public Brand? Brand { get; set; }
    public ICollection<ProductCategory> ProductCategories { get; set; }
        = new List<ProductCategory>();

    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
    public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();
}
```

## `backend/DoRentMe.Api/Models/ProductImage.cs`

```csharp
namespace DoRentMe.Api.Models;

public class ProductImage
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string ImageUrl { get; set; } = null!;
    public bool IsPrimary { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Product Product { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Models/ProductVariant.cs`

```csharp
namespace DoRentMe.Api.Models;

public class ProductVariant
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public string Size { get; set; } = null!;
    public string Color { get; set; } = null!;
    public string? VariantCode { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Product Product { get; set; } = null!;
    public ICollection<ProductInventoryItem> InventoryItems { get; set; } = new List<ProductInventoryItem>();
}
```

## `backend/DoRentMe.Api/Models/ProductInventoryItem.cs`

```csharp
namespace DoRentMe.Api.Models;

public class ProductInventoryItem
{
    public int Id { get; set; }
    public int ProductVariantId { get; set; }
    public string AssetCode { get; set; } = null!;
    public string Condition { get; set; } = "GOOD";
    public string Status { get; set; } = "AVAILABLE";
    public string? Notes { get; set; }
    public DateTime? AcquiredAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ProductVariant ProductVariant { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Models/ProductCategory.cs`

```csharp
using DoRentMe.Api.Models;

public class ProductCategory
{
    public int ProductId { get; set; }
    public int CategoryId { get; set; }

    public Product Product { get; set; } = null!;
    public Category Category { get; set; } = null!;
}
```

## `backend/DoRentMe.Api/Models/Brand.cs`

```csharp
namespace DoRentMe.Api.Models;

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
```

## `backend/DoRentMe.Api/Models/Category.cs`

```csharp
namespace DoRentMe.Api.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string Slug { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<ProductCategory> ProductCategories { get; set; }
    = new List<ProductCategory>();
}
```

## `backend/DoRentMe.Api/Models/Shop.cs`

```csharp
namespace DoRentMe.Api.Models;

public class Shop
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public int OwnerUserId { get; set; }
    public string Phone { get; set; } = null!;
    public string? Email { get; set; }
    public string Address { get; set; } = null!;
    public string? Ward { get; set; }
    public string? District { get; set; }
    public string? City { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountNo { get; set; }
    public string? BankAccountName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User OwnerUser { get; set; } = null!;

    public ICollection<Product> Products { get; set; } = new List<Product>();
}
```

## `backend/DoRentMe.Api/Models/User.cs`

```csharp
namespace DoRentMe.Api.Models;

public class User
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string PasswordHash { get; set; } = null!;
    public int LoyaltyPoints { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public Role Role { get; set; } = null!;
    public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
    public ICollection<Product> OwnedProducts { get; set; } = new List<Product>();
}
```

## `database/schema.sql`

```sql
-- DoRentMe AI Fashion Rental Platform
-- Fresh schema for Microsoft SQL Server / Azure SQL Database.
-- This file creates an empty, normalized database schema.

-- 1. Roles
CREATE TABLE Roles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Description NVARCHAR(255) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT UQ_Roles_Code UNIQUE (Code),
  CONSTRAINT UQ_Roles_Name UNIQUE (Name)
);

-- 2. Users
CREATE TABLE Users (
  Id INT PRIMARY KEY IDENTITY(1,1),
  RoleId INT NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  PasswordHash NVARCHAR(255) NOT NULL,
  LoyaltyPoints INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Users_Roles FOREIGN KEY (RoleId) REFERENCES Roles(Id),
  CONSTRAINT UQ_Users_Email UNIQUE (Email),
  CONSTRAINT CK_Users_LoyaltyPoints CHECK (LoyaltyPoints >= 0)
);

-- 3. UserAddresses
CREATE TABLE UserAddresses (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  AddressLine NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  Note NVARCHAR(500) NULL,
  IsDefault BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_UserAddresses_Users FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- 4. Shops
CREATE TABLE Shops (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NOT NULL,
  Email NVARCHAR(150) NULL,
  Address NVARCHAR(500) NOT NULL,
  Ward NVARCHAR(100) NULL,
  District NVARCHAR(100) NULL,
  City NVARCHAR(100) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL
);

-- 5. Categories
CREATE TABLE Categories (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Categories_Name UNIQUE (Name),
  CONSTRAINT UQ_Categories_Slug UNIQUE (Slug)
);

-- 6. Brands
CREATE TABLE Brands (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Slug NVARCHAR(120) NOT NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Brands_Name UNIQUE (Name),
  CONSTRAINT UQ_Brands_Slug UNIQUE (Slug)
);

-- 7. Products
CREATE TABLE Products (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OwnerUserId INT NOT NULL,
  CategoryId INT NOT NULL,
  BrandId INT NULL,
  Name NVARCHAR(200) NOT NULL,
  Slug NVARCHAR(220) NOT NULL,
  Description NVARCHAR(MAX) NULL,
  Price1Day DECIMAL(18,2) NOT NULL,
  Price3Day DECIMAL(18,2) NOT NULL,
  ExtraDayPrice DECIMAL(18,2) NOT NULL DEFAULT 0,
  PriceTag DECIMAL(18,2) NULL,
  PriceDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  PurchaseCost DECIMAL(18,2) NULL,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Products_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Products_OwnerUser FOREIGN KEY (OwnerUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Products_Categories FOREIGN KEY (CategoryId) REFERENCES Categories(Id),
  CONSTRAINT FK_Products_Brands FOREIGN KEY (BrandId) REFERENCES Brands(Id),
  CONSTRAINT UQ_Products_Slug UNIQUE (Slug),
  CONSTRAINT CK_Products_Price1Day CHECK (Price1Day >= 0),
  CONSTRAINT CK_Products_Price3Day CHECK (Price3Day >= 0),
  CONSTRAINT CK_Products_ExtraDayPrice CHECK (ExtraDayPrice >= 0),
  CONSTRAINT CK_Products_PriceTag CHECK (PriceTag IS NULL OR PriceTag >= 0),
  CONSTRAINT CK_Products_PriceDeposit CHECK (PriceDeposit >= 0),
  CONSTRAINT CK_Products_PurchaseCost CHECK (PurchaseCost IS NULL OR PurchaseCost >= 0),
  CONSTRAINT CK_Products_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_Products_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 8. ProductImages
CREATE TABLE ProductImages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  ImageUrl NVARCHAR(500) NOT NULL,
  IsPrimary BIT NOT NULL DEFAULT 0,
  SortOrder INT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductImages_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_ProductImages_SortOrder CHECK (SortOrder >= 0)
);

-- 9. ProductVariants
CREATE TABLE ProductVariants (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Size NVARCHAR(50) NOT NULL,
  Color NVARCHAR(80) NOT NULL,
  VariantCode NVARCHAR(100) NULL,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductVariants_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductVariants_Product_Size_Color UNIQUE (ProductId, Size, Color)
);

-- 10. ProductInventoryItems
CREATE TABLE ProductInventoryItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductVariantId INT NOT NULL,
  AssetCode NVARCHAR(100) NOT NULL,
  Condition NVARCHAR(50) NOT NULL DEFAULT 'GOOD',
  Status NVARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
  Notes NVARCHAR(500) NULL,
  AcquiredAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ProductInventoryItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT UQ_ProductInventoryItems_AssetCode UNIQUE (AssetCode),
  CONSTRAINT CK_ProductInventoryItems_Condition CHECK (
    Condition IN ('NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED')
  ),
  CONSTRAINT CK_ProductInventoryItems_Status CHECK (
    Status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'CLEANING', 'MAINTENANCE', 'DAMAGED', 'LOST', 'RETIRED')
  )
);

-- 11. Carts
CREATE TABLE Carts (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'active',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Carts_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Carts_UserOrSession CHECK (UserId IS NOT NULL OR SessionId IS NOT NULL),
  CONSTRAINT CK_Carts_Status CHECK (Status IN ('active', 'ordered', 'abandoned'))
);

-- 12. CartItems
CREATE TABLE CartItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  CartId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  Quantity INT NOT NULL DEFAULT 1,
  RentalStartDate DATE NOT NULL,
  RentalEndDate DATE NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_CartItems_Carts FOREIGN KEY (CartId) REFERENCES Carts(Id),
  CONSTRAINT FK_CartItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_CartItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_CartItems_DateRange CHECK (RentalEndDate > RentalStartDate),
  CONSTRAINT UQ_CartItems_EquivalentLine UNIQUE (CartId, ProductVariantId, RentalStartDate, RentalEndDate)
);

-- 13. Orders
CREATE TABLE Orders (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderCode NVARCHAR(50) NOT NULL,
  UserId INT NULL,
  CustomerName NVARCHAR(100) NOT NULL,
  CustomerPhone NVARCHAR(20) NOT NULL,
  CustomerEmail NVARCHAR(150) NULL,
  ShippingAddress NVARCHAR(500) NOT NULL,
  CustomerNote NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending_confirmation',
  TotalRent DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDeposit DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalDiscount DECIMAL(18,2) NOT NULL DEFAULT 0,
  TotalAmount AS (TotalRent + TotalDeposit - TotalDiscount) PERSISTED,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  DeliveryConfirmed BIT NOT NULL DEFAULT 0,
  ReturnRequestedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Orders_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Orders_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_Orders_OrderCode UNIQUE (OrderCode),
  CONSTRAINT CK_Orders_Status CHECK (
    Status IN ('pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned', 'cancelled')
  ),
  CONSTRAINT CK_Orders_TotalRent CHECK (TotalRent >= 0),
  CONSTRAINT CK_Orders_TotalDeposit CHECK (TotalDeposit >= 0),
  CONSTRAINT CK_Orders_TotalDiscount CHECK (TotalDiscount >= 0),
  CONSTRAINT CK_Orders_DateRange CHECK (EndDate > StartDate)
);

-- 14. OrderItems
CREATE TABLE OrderItems (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  ProductId INT NOT NULL,
  ProductVariantId INT NOT NULL,
  ProductNameSnapshot NVARCHAR(200) NOT NULL,
  SizeSnapshot NVARCHAR(50) NOT NULL,
  ColorSnapshot NVARCHAR(80) NOT NULL,
  Quantity INT NOT NULL,
  PricePerItem DECIMAL(18,2) NOT NULL,
  DepositPerItem DECIMAL(18,2) NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderItems_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderItems_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_OrderItems_ProductVariants FOREIGN KEY (ProductVariantId) REFERENCES ProductVariants(Id),
  CONSTRAINT CK_OrderItems_Quantity CHECK (Quantity > 0),
  CONSTRAINT CK_OrderItems_PricePerItem CHECK (PricePerItem >= 0),
  CONSTRAINT CK_OrderItems_DepositPerItem CHECK (DepositPerItem >= 0)
);

-- 15. RentalReservations
CREATE TABLE RentalReservations (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderItemId INT NOT NULL,
  ProductInventoryItemId INT NOT NULL,
  StartDate DATE NOT NULL,
  EndDate DATE NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'RESERVED',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_RentalReservations_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT FK_RentalReservations_ProductInventoryItems FOREIGN KEY (ProductInventoryItemId) REFERENCES ProductInventoryItems(Id),
  CONSTRAINT CK_RentalReservations_DateRange CHECK (EndDate > StartDate),
  CONSTRAINT CK_RentalReservations_Status CHECK (
    Status IN ('RESERVED', 'ACTIVE', 'COMPLETED', 'CANCELLED')
  )
);

-- 16. Payments
CREATE TABLE Payments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  Method NVARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransferContent NVARCHAR(200) NULL,
  TransactionCode NVARCHAR(100) NULL,
  ProviderTransactionId NVARCHAR(150) NULL,
  PaidAt DATETIME2 NULL,
  ConfirmedByUserId INT NULL,
  ConfirmedAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Payments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Payments_ConfirmedByUser FOREIGN KEY (ConfirmedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Payments_Amount CHECK (Amount >= 0),
  CONSTRAINT CK_Payments_Status CHECK (
    Status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')
  )
);

-- 17. Shipments
CREATE TABLE Shipments (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShopId INT NULL,
  OrderId INT NOT NULL,
  Direction NVARCHAR(20) NOT NULL DEFAULT 'outbound',
  Provider NVARCHAR(50) NOT NULL DEFAULT 'SPX',
  ServiceType NVARCHAR(50) NOT NULL DEFAULT 'instant',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  TrackingCode NVARCHAR(100) NULL,
  ProviderOrderCode NVARCHAR(100) NULL,
  SenderName NVARCHAR(100) NOT NULL,
  SenderPhone NVARCHAR(20) NOT NULL,
  SenderAddress NVARCHAR(500) NOT NULL,
  ReceiverName NVARCHAR(100) NOT NULL,
  ReceiverPhone NVARCHAR(20) NOT NULL,
  ReceiverAddress NVARCHAR(500) NOT NULL,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  CodAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  PickupTime DATETIME2 NULL,
  EstimatedDeliveryTime DATETIME2 NULL,
  DeliveredAt DATETIME2 NULL,
  CancelledAt DATETIME2 NULL,
  RawProviderResponse NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Shipments_Shops FOREIGN KEY (ShopId) REFERENCES Shops(Id),
  CONSTRAINT FK_Shipments_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_Shipments_Direction CHECK (Direction IN ('outbound', 'return')),
  CONSTRAINT CK_Shipments_Status CHECK (
    Status IN ('pending', 'created', 'assigned', 'picked_up', 'shipping', 'delivered', 'failed', 'cancelled', 'returning', 'returned')
  ),
  CONSTRAINT CK_Shipments_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_Shipments_CodAmount CHECK (CodAmount >= 0)
);

-- 18. ShipmentTrackingEvents
CREATE TABLE ShipmentTrackingEvents (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ShipmentId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL,
  Message NVARCHAR(500) NULL,
  Location NVARCHAR(255) NULL,
  ProviderEventCode NVARCHAR(100) NULL,
  ProviderEventTime DATETIME2 NULL,
  RawEvent NVARCHAR(MAX) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ShipmentTrackingEvents_Shipments FOREIGN KEY (ShipmentId) REFERENCES Shipments(Id)
);

-- 19. OrderStatusHistory
CREATE TABLE OrderStatusHistory (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  OldStatus NVARCHAR(50) NULL,
  NewStatus NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedByUserId INT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_OrderStatusHistory_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_OrderStatusHistory_Users FOREIGN KEY (CreatedByUserId) REFERENCES Users(Id)
);

-- 20. Refunds
CREATE TABLE Refunds (
  Id INT PRIMARY KEY IDENTITY(1,1),
  OrderId INT NOT NULL,
  PaymentId INT NULL,
  Type NVARCHAR(50) NOT NULL DEFAULT 'deposit',
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  Amount DECIMAL(18,2) NOT NULL,
  Reason NVARCHAR(500) NULL,
  BankName NVARCHAR(100) NULL,
  BankAccountNo NVARCHAR(50) NULL,
  BankAccountName NVARCHAR(100) NULL,
  TransactionCode NVARCHAR(100) NULL,
  RequestedByUserId INT NULL,
  ProcessedByUserId INT NULL,
  RequestedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  ProcessedAt DATETIME2 NULL,

  CONSTRAINT FK_Refunds_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT FK_Refunds_Payments FOREIGN KEY (PaymentId) REFERENCES Payments(Id),
  CONSTRAINT FK_Refunds_RequestedByUser FOREIGN KEY (RequestedByUserId) REFERENCES Users(Id),
  CONSTRAINT FK_Refunds_ProcessedByUser FOREIGN KEY (ProcessedByUserId) REFERENCES Users(Id),
  CONSTRAINT CK_Refunds_Type CHECK (Type IN ('deposit', 'order_cancel', 'compensation', 'other')),
  CONSTRAINT CK_Refunds_Status CHECK (Status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
  CONSTRAINT CK_Refunds_Amount CHECK (Amount >= 0)
);

-- 21. ProductLikes
CREATE TABLE ProductLikes (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductLikes_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_ProductLikes_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductLikes_User_Product UNIQUE (UserId, ProductId)
);

-- 22. Reviews
CREATE TABLE Reviews (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  ProductId INT NOT NULL,
  OrderItemId INT NOT NULL,
  Rating INT NOT NULL,
  Comment NVARCHAR(1000) NULL,
  IsApproved BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_Reviews_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_Reviews_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT FK_Reviews_OrderItems FOREIGN KEY (OrderItemId) REFERENCES OrderItems(Id),
  CONSTRAINT UQ_Reviews_User_OrderItem UNIQUE (UserId, OrderItemId),
  CONSTRAINT CK_Reviews_Rating CHECK (Rating BETWEEN 1 AND 5)
);

-- 23. ChatSessions
CREATE TABLE ChatSessions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  SessionId NVARCHAR(100) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_ChatSessions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT UQ_ChatSessions_SessionId UNIQUE (SessionId)
);

-- 24. ChatMessages
CREATE TABLE ChatMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ChatSessionId INT NOT NULL,
  Role NVARCHAR(20) NOT NULL,
  Message NVARCHAR(MAX) NOT NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ChatMessages_ChatSessions FOREIGN KEY (ChatSessionId) REFERENCES ChatSessions(Id),
  CONSTRAINT CK_ChatMessages_Role CHECK (Role IN ('user', 'model', 'system'))
);

-- 25. TryOnRequests
CREATE TABLE TryOnRequests (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NULL,
  ProductId INT NOT NULL,
  RequestId NVARCHAR(100) NULL,
  UserImageUrl NVARCHAR(500) NOT NULL,
  GarmentImageUrl NVARCHAR(500) NOT NULL,
  ResultImageUrl NVARCHAR(500) NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'pending',
  ErrorMessage NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,
  CompletedAt DATETIME2 NULL,

  CONSTRAINT FK_TryOnRequests_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_TryOnRequests_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT CK_TryOnRequests_Status CHECK (Status IN ('pending', 'processing', 'completed', 'failed'))
);

-- 26. LoyaltyTransactions
CREATE TABLE LoyaltyTransactions (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  OrderId INT NULL,
  Points INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Note NVARCHAR(500) NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_LoyaltyTransactions_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_LoyaltyTransactions_Orders FOREIGN KEY (OrderId) REFERENCES Orders(Id),
  CONSTRAINT CK_LoyaltyTransactions_Type CHECK (Type IN ('earn', 'redeem', 'adjust'))
);

-- 27. Vouchers
CREATE TABLE Vouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Code NVARCHAR(50) NOT NULL,
  Name NVARCHAR(100) NOT NULL,
  DiscountType NVARCHAR(20) NOT NULL,
  DiscountValue DECIMAL(18,2) NOT NULL,
  RequiredPoints INT NOT NULL DEFAULT 0,
  MinOrderAmount DECIMAL(18,2) NULL,
  StartAt DATETIME2 NULL,
  EndAt DATETIME2 NULL,
  UsageLimit INT NULL,
  UsedCount INT NOT NULL DEFAULT 0,
  IsActive BIT NOT NULL DEFAULT 1,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT UQ_Vouchers_Code UNIQUE (Code),
  CONSTRAINT CK_Vouchers_DiscountType CHECK (DiscountType IN ('fixed', 'percent')),
  CONSTRAINT CK_Vouchers_DiscountValue CHECK (DiscountValue >= 0),
  CONSTRAINT CK_Vouchers_RequiredPoints CHECK (RequiredPoints >= 0),
  CONSTRAINT CK_Vouchers_MinOrderAmount CHECK (MinOrderAmount IS NULL OR MinOrderAmount >= 0),
  CONSTRAINT CK_Vouchers_UsageLimit CHECK (UsageLimit IS NULL OR UsageLimit > 0),
  CONSTRAINT CK_Vouchers_UsedCount CHECK (UsedCount >= 0),
  CONSTRAINT CK_Vouchers_DateRange CHECK (EndAt IS NULL OR StartAt IS NULL OR EndAt > StartAt)
);

-- 28. UserVouchers
CREATE TABLE UserVouchers (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  VoucherId INT NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'available',
  AcquiredAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UsedAt DATETIME2 NULL,
  ExpiresAt DATETIME2 NULL,

  CONSTRAINT FK_UserVouchers_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT FK_UserVouchers_Vouchers FOREIGN KEY (VoucherId) REFERENCES Vouchers(Id),
  CONSTRAINT CK_UserVouchers_Status CHECK (Status IN ('available', 'used', 'expired'))
);

-- 29. ContactMessages
CREATE TABLE ContactMessages (
  Id INT PRIMARY KEY IDENTITY(1,1),
  Name NVARCHAR(100) NOT NULL,
  Email NVARCHAR(150) NOT NULL,
  Phone NVARCHAR(20) NULL,
  Subject NVARCHAR(200) NULL,
  Message NVARCHAR(MAX) NOT NULL,
  Status NVARCHAR(50) NOT NULL DEFAULT 'new',
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT CK_ContactMessages_Status CHECK (Status IN ('new', 'read', 'replied', 'closed'))
);

-- 30. NewsArticles
CREATE TABLE NewsArticles (
  Id INT PRIMARY KEY IDENTITY(1,1),
  AuthorId INT NULL,
  Title NVARCHAR(255) NOT NULL,
  Slug NVARCHAR(255) NOT NULL,
  Description NVARCHAR(500) NULL,
  Content NVARCHAR(MAX) NULL,
  ImageUrl NVARCHAR(500) NULL,
  PublishedAt DATETIME2 NULL,
  IsPublished BIT NOT NULL DEFAULT 0,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
  UpdatedAt DATETIME2 NULL,

  CONSTRAINT FK_NewsArticles_Users FOREIGN KEY (AuthorId) REFERENCES Users(Id) ON DELETE SET NULL,
  CONSTRAINT UQ_NewsArticles_Slug UNIQUE (Slug)
);

-- 31. ProductMonthlyStats
CREATE TABLE ProductMonthlyStats (
  Id INT PRIMARY KEY IDENTITY(1,1),
  ProductId INT NOT NULL,
  Year INT NOT NULL,
  Month INT NOT NULL,
  TotalOrders INT NOT NULL DEFAULT 0,
  TotalQuantityRented INT NOT NULL DEFAULT 0,
  RentRevenue DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositCollected DECIMAL(18,2) NOT NULL DEFAULT 0,
  DepositRefunded DECIMAL(18,2) NOT NULL DEFAULT 0,
  ShippingFee DECIMAL(18,2) NOT NULL DEFAULT 0,
  DiscountAmount DECIMAL(18,2) NOT NULL DEFAULT 0,
  CleaningCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  MaintenanceCost DECIMAL(18,2) NOT NULL DEFAULT 0,
  GrossProfit AS (RentRevenue - ShippingFee - DiscountAmount - CleaningCost - MaintenanceCost) PERSISTED,
  UpdatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_ProductMonthlyStats_Products FOREIGN KEY (ProductId) REFERENCES Products(Id),
  CONSTRAINT UQ_ProductMonthlyStats_Product_Month UNIQUE (ProductId, Year, Month),
  CONSTRAINT CK_ProductMonthlyStats_Year CHECK (Year >= 2000),
  CONSTRAINT CK_ProductMonthlyStats_Month CHECK (Month BETWEEN 1 AND 12),
  CONSTRAINT CK_ProductMonthlyStats_TotalOrders CHECK (TotalOrders >= 0),
  CONSTRAINT CK_ProductMonthlyStats_TotalQuantityRented CHECK (TotalQuantityRented >= 0),
  CONSTRAINT CK_ProductMonthlyStats_RentRevenue CHECK (RentRevenue >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositCollected CHECK (DepositCollected >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DepositRefunded CHECK (DepositRefunded >= 0),
  CONSTRAINT CK_ProductMonthlyStats_ShippingFee CHECK (ShippingFee >= 0),
  CONSTRAINT CK_ProductMonthlyStats_DiscountAmount CHECK (DiscountAmount >= 0),
  CONSTRAINT CK_ProductMonthlyStats_CleaningCost CHECK (CleaningCost >= 0),
  CONSTRAINT CK_ProductMonthlyStats_MaintenanceCost CHECK (MaintenanceCost >= 0)
);

-- 32. Notifications
CREATE TABLE Notifications (
  Id INT PRIMARY KEY IDENTITY(1,1),
  UserId INT NOT NULL,
  Type NVARCHAR(50) NOT NULL,
  Title NVARCHAR(200) NOT NULL,
  Message NVARCHAR(1000) NOT NULL,
  RelatedType NVARCHAR(50) NULL,
  RelatedId INT NULL,
  IsRead BIT NOT NULL DEFAULT 0,
  ReadAt DATETIME2 NULL,
  CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),

  CONSTRAINT FK_Notifications_Users FOREIGN KEY (UserId) REFERENCES Users(Id),
  CONSTRAINT CK_Notifications_Type CHECK (
    Type IN ('order', 'payment', 'shipping', 'refund', 'voucher', 'system', 'tryon')
  )
);

-- Filtered unique indexes.
CREATE UNIQUE INDEX UX_ProductImages_OnePrimaryPerProduct
ON ProductImages(ProductId)
WHERE IsPrimary = 1;

CREATE UNIQUE INDEX UX_Carts_Active_User
ON Carts(UserId)
WHERE UserId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Carts_Active_Session
ON Carts(SessionId)
WHERE SessionId IS NOT NULL AND Status = 'active';

CREATE UNIQUE INDEX UX_Payments_ProviderTransactionId
ON Payments(ProviderTransactionId)
WHERE ProviderTransactionId IS NOT NULL;

CREATE UNIQUE INDEX UX_ProductVariants_VariantCode
ON ProductVariants(VariantCode)
WHERE VariantCode IS NOT NULL;

CREATE UNIQUE INDEX UX_TryOnRequests_RequestId
ON TryOnRequests(RequestId)
WHERE RequestId IS NOT NULL;

-- General indexes.
CREATE INDEX IX_Users_RoleId ON Users(RoleId);
CREATE INDEX IX_UserAddresses_UserId ON UserAddresses(UserId);
CREATE INDEX IX_Shops_IsActive ON Shops(IsActive);

CREATE INDEX IX_Products_ShopId ON Products(ShopId);
CREATE INDEX IX_Products_OwnerUserId ON Products(OwnerUserId);
CREATE INDEX IX_Products_CategoryId ON Products(CategoryId);
CREATE INDEX IX_Products_BrandId ON Products(BrandId);
CREATE INDEX IX_Products_IsActive ON Products(IsActive);

CREATE INDEX IX_ProductImages_ProductId ON ProductImages(ProductId);
CREATE INDEX IX_ProductVariants_ProductId ON ProductVariants(ProductId);
CREATE INDEX IX_ProductInventoryItems_ProductVariantId ON ProductInventoryItems(ProductVariantId);
CREATE INDEX IX_ProductInventoryItems_Status ON ProductInventoryItems(Status);

CREATE INDEX IX_Carts_UserId ON Carts(UserId);
CREATE INDEX IX_Carts_SessionId ON Carts(SessionId);
CREATE INDEX IX_CartItems_CartId ON CartItems(CartId);
CREATE INDEX IX_CartItems_ProductVariantId ON CartItems(ProductVariantId);

CREATE INDEX IX_Orders_ShopId ON Orders(ShopId);
CREATE INDEX IX_Orders_UserId ON Orders(UserId);
CREATE INDEX IX_Orders_Status ON Orders(Status);
CREATE INDEX IX_Orders_CreatedAt ON Orders(CreatedAt);

CREATE INDEX IX_OrderItems_OrderId ON OrderItems(OrderId);
CREATE INDEX IX_OrderItems_ProductId ON OrderItems(ProductId);
CREATE INDEX IX_OrderItems_ProductVariantId ON OrderItems(ProductVariantId);

CREATE INDEX IX_RentalReservations_Inventory_Date_Status
ON RentalReservations(ProductInventoryItemId, StartDate, EndDate, Status);

CREATE INDEX IX_Payments_OrderId ON Payments(OrderId);
CREATE INDEX IX_Payments_Status ON Payments(Status);
CREATE INDEX IX_Payments_TransactionCode ON Payments(TransactionCode);

CREATE INDEX IX_Shipments_ShopId ON Shipments(ShopId);
CREATE INDEX IX_Shipments_OrderId ON Shipments(OrderId);
CREATE INDEX IX_Shipments_Status ON Shipments(Status);
CREATE INDEX IX_Shipments_Direction ON Shipments(Direction);
CREATE INDEX IX_Shipments_TrackingCode ON Shipments(TrackingCode);

CREATE INDEX IX_ShipmentTrackingEvents_ShipmentId_CreatedAt
ON ShipmentTrackingEvents(ShipmentId, CreatedAt);

CREATE INDEX IX_OrderStatusHistory_OrderId ON OrderStatusHistory(OrderId);
CREATE INDEX IX_OrderStatusHistory_OrderId_CreatedAt ON OrderStatusHistory(OrderId, CreatedAt);

CREATE INDEX IX_Refunds_OrderId ON Refunds(OrderId);
CREATE INDEX IX_Refunds_PaymentId ON Refunds(PaymentId);
CREATE INDEX IX_Refunds_Status ON Refunds(Status);

CREATE INDEX IX_ProductLikes_UserId ON ProductLikes(UserId);
CREATE INDEX IX_ProductLikes_ProductId ON ProductLikes(ProductId);

CREATE INDEX IX_Reviews_UserId ON Reviews(UserId);
CREATE INDEX IX_Reviews_ProductId_CreatedAt ON Reviews(ProductId, CreatedAt);
CREATE INDEX IX_Reviews_OrderItemId ON Reviews(OrderItemId);

CREATE INDEX IX_ChatSessions_UserId ON ChatSessions(UserId);
CREATE INDEX IX_ChatMessages_ChatSessionId_CreatedAt ON ChatMessages(ChatSessionId, CreatedAt);

CREATE INDEX IX_TryOnRequests_UserId_CreatedAt ON TryOnRequests(UserId, CreatedAt);
CREATE INDEX IX_TryOnRequests_ProductId ON TryOnRequests(ProductId);
CREATE INDEX IX_TryOnRequests_Status ON TryOnRequests(Status);

CREATE INDEX IX_LoyaltyTransactions_UserId_CreatedAt ON LoyaltyTransactions(UserId, CreatedAt);
CREATE INDEX IX_UserVouchers_UserId_Status ON UserVouchers(UserId, Status);
CREATE INDEX IX_UserVouchers_VoucherId ON UserVouchers(VoucherId);

CREATE INDEX IX_ContactMessages_Status ON ContactMessages(Status);
CREATE INDEX IX_NewsArticles_AuthorId ON NewsArticles(AuthorId);
CREATE INDEX IX_NewsArticles_IsPublished ON NewsArticles(IsPublished);
CREATE INDEX IX_NewsArticles_PublishedAt ON NewsArticles(PublishedAt);

CREATE INDEX IX_ProductMonthlyStats_ProductId ON ProductMonthlyStats(ProductId);
CREATE INDEX IX_ProductMonthlyStats_YearMonth ON ProductMonthlyStats(Year, Month);

CREATE INDEX IX_Notifications_UserId ON Notifications(UserId);
CREATE INDEX IX_Notifications_UserId_IsRead ON Notifications(UserId, IsRead);
CREATE INDEX IX_Notifications_Type ON Notifications(Type);

-- Seed base roles.
INSERT INTO Roles (Code, Name, Description)
VALUES
('CUSTOMER', 'Customer', 'Customer who rents fashion products'),
('LENDER', 'Lender', 'User who owns and lists rental products'),
('ADMIN', 'Admin', 'Platform administrator');

-- Notes:
-- 1. Products.OwnerUserId must point to a user with the LENDER role. SQL Server cannot enforce this
--    role rule with a normal FK, so enforce it in application/service logic.
-- 2. RentalReservations prevents double booking through transactional application logic:
--    inside a transaction, find a candidate ProductInventoryItem, check for overlapping
--    active reservations where Status IN ('RESERVED', 'ACTIVE'), create the reservation, then commit.
--    The IX_RentalReservations_Inventory_Date_Status index supports that check, but a simple UNIQUE
--    constraint cannot fully prevent date-range overlap.
-- 3. ProductInventoryItems is the source of truth for stock counts. Do not maintain writable
--    TotalQuantity/AvailableQuantity columns on Products.
-- 4. ProductLikes and Reviews are the source of truth for likes/rating. Any displayed counts should
--    be calculated or maintained as documented caches outside this schema.
-- 5. OrderItems store snapshots so historical orders are stable even if products, variants, or prices change.
```

## `database/seed-legacy-catalog.mysql.sql`

```sql
-- Generated by tools/catalog/generate-legacy-catalog-seed.js
-- Idempotent MySQL seed for the legacy DoRentMe catalog.
-- Review @dorentme_seed_* variables before running against production.

START TRANSACTION;

SET @dorentme_seed_owner_email = 'catalog-seed@dorentme.local';
SET @dorentme_seed_shop_name = 'DoRentMe Catalog Seed Shop';
SET @dorentme_seed_shop_id = (SELECT Id FROM Shops WHERE IsActive = 1 ORDER BY Id LIMIT 1);

INSERT INTO Roles (Code, Name, Description, CreatedAt)
SELECT 'LENDER', 'Lender', 'Lender role', UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Code = 'LENDER');

SET @dorentme_lender_role_id = (SELECT Id FROM Roles WHERE Code = 'LENDER' LIMIT 1);

INSERT INTO Users (RoleId, Name, Email, Phone, PasswordHash, LoyaltyPoints, IsActive, CreatedAt)
SELECT @dorentme_lender_role_id, 'Catalog Seed Owner', @dorentme_seed_owner_email, NULL, 'SEEDED_DISABLED_LOGIN', 0, 0, UTC_TIMESTAMP()
WHERE @dorentme_seed_shop_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM Users WHERE Email = @dorentme_seed_owner_email);

SET @dorentme_seed_owner_id = (SELECT Id FROM Users WHERE Email = @dorentme_seed_owner_email LIMIT 1);

INSERT INTO Shops (Name, OwnerUserId, Phone, Email, Address, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_name, @dorentme_seed_owner_id, '0000000000', @dorentme_seed_owner_email, 'Seeded catalog shop', 1, UTC_TIMESTAMP()
WHERE @dorentme_seed_shop_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM Shops WHERE Name = @dorentme_seed_shop_name);

SET @dorentme_seed_shop_id = COALESCE(@dorentme_seed_shop_id, (SELECT Id FROM Shops WHERE Name = @dorentme_seed_shop_name LIMIT 1));

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'ﾃ｛ dﾃi', 'ao-dai', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'ao-dai');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Ph盻･ ki盻㌻', 'phu-kien', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'phu-kien');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y ﾄ訴 bi盻ハ', 'vay-di-bien', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-di-bien');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y d盻ｱ ti盻㌘', 'vay-du-tiec', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-du-tiec');

INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)
SELECT 'Vﾃ｡y l盻･a', 'vay-lua', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = 'vay-lua');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'AMELIEE', 'ameliee', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'ameliee');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'CHIRON', 'chiron', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'chiron');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'CHOUCHOU', 'chouchou', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'chouchou');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'D.CHIC', 'd-chic', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'd-chic');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'FLANE', 'flane', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'flane');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'HﾆｯﾆNG BOUTIQUE', 'huong-boutique', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'huong-boutique');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'JOLIE LOFT', 'jolie-loft', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'jolie-loft');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Khﾃ｡c', 'khac', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'khac');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Mainichi', 'mainichi', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'mainichi');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'MAISON LONG', 'maison-long', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'maison-long');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Mys.P', 'mys-p', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'mys-p');

INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)
SELECT 'Sﾃ・VINTAGE', 'so-vintage', 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = 'so-vintage');

-- FLANE 窶・UY盻・ KHANH
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・UY盻・ KHANH', 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn', 'ﾃ｛ dﾃi', 260000, 300000, 350000, 1900000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/flane-uyenkhanh-a78b7f41388f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-flane-uyen-khanh-ao-dai-flane-uyenkhanh-8z8gmn-001');

-- LINN DESIGN 窶・TU盻・HI盻N
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'LINN DESIGN 窶・TU盻・HI盻N', 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53', 'ﾃ｛ dﾃi', 295000, 340000, 350000, 1590000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/linn-design-tue-hien-d3ac5a259dfc.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-linn-design-tue-hien-ao-dai-linn-design-tue-hien-1yru53-001');

-- MAINICHI 窶・M盻呂 MIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mainichi' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAINICHI 窶・M盻呂 MIﾃ劾', 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf', 'ﾃ｛ dﾃi', 220000, 260000, 350000, 1200000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/mainichi-moc-mien-01806b1b979a.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/mainichi-moc-mien-01806b1b979a.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-mainichi-moc-mien-ao-dai-mainichi-moc-mien-juw8tf-001');

-- MAINICHI 窶・Yﾃ劾 CHI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mainichi' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAINICHI 窶・Yﾃ劾 CHI', 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n', 'ﾃ｛ dﾃi', 250000, 290000, 350000, 1550000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/mainichi-yen-chi-f9570e47ee6b.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-mainichi-yen-chi-ao-dai-mainichi-yen-chi-1lr828n-001');

-- MAISON LONG 窶・NI盻M N盻蜂
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'maison-long' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAISON LONG 窶・NI盻M N盻蜂', 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex', 'ﾃ｛ dﾃi', 180000, 220000, 350000, 1150000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/maison-long-niem-no-800686bb8652.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/maison-long-niem-no-800686bb8652.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-maison-long-niem-noi-ao-dai-maison-long-niem-no-pt6vex-001');

-- D.CHIC NﾃNG THﾆ PH盻・H盻露
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC NﾃNG THﾆ PH盻・H盻露', 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu', 'ﾃ｛ dﾃi', 280000, 320000, 350000, 1950000, 1200000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-nang-tho-pho-hoi-210371af8908.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-nang-tho-pho-hoi-ao-dai-dchic-nang-tho-pho-hoi-1q4eyyu-001');

-- D.CHIC COUTURE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC COUTURE', 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c', 'ﾃ｛ dﾃi', 450000, 500000, 350000, 3500000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-couture-11a66bffc46b.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-couture-11a66bffc46b.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-couture-ao-dai-dchic-couture-prvi2c-001');

-- D.CHIC XUﾃ・ VIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC XUﾃ・ VIﾃ劾', 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m', 'ﾃ｛ dﾃi', 440000, 480000, 350000, 2850000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/d-chic-xuan-vien-639f979153cf.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-xuan-vien-ao-dai-d-chic-xuan-vien-yoer7m-001');

-- D.CHIC ﾃ・NHIﾃ劾
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC ﾃ・NHIﾃ劾', 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd', 'ﾃ｛ dﾃi', 450000, 490000, 350000, 2950000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/dchic-y-nhien-4bd76df1ba20.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-y-nhien-ao-dai-dchic-y-nhien-1w3oedd-001');

-- D.CHIC THIﾃ劾 ﾃ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'ao-dai' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'D.CHIC THIﾃ劾 ﾃ・, 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2', 'ﾃ｛ dﾃi', 410000, 450000, 350000, 2600000, 1900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/ao-dai/d-chic-thien-y-211c0ae58a7c.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-ao-dai-d-chic-thien-y-ao-dai-d-chic-thien-y-169pne2-001');

-- TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER', 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu', 'Vﾃ｡y ﾄ訴 bi盻ハ', 160000, 190000, 330000, 930000, 650000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-FREESI', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-tipblu-am-voan-tim-lavender-vay-di-bien-tipblu-dam-voan-tim-lavender-bv6xu-001');

-- CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI', 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 'Vﾃ｡y ﾄ訴 bi盻ハ', 225000, 255000, 330000, 1110000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-chouchou-am-ren-nude-dang-dai-vay-di-bien-chou-chou-dam-ren-nude-dang-dai-16q7a7u');

-- AMELIE 窶・VANESSA DRESS XANH NH蘯T
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・VANESSA DRESS XANH NH蘯T', 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 'Vﾃ｡y ﾄ訴 bi盻ハ', 250000, 290000, 340000, 1530000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-amelie-vanessa-dress-xanh-nhat-vay-di-bien-amelie-vanessa-dress-xanh-nhat-1x4eyxi');

-- JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６', 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa', 'Vﾃ｡y ﾄ訴 bi盻ハ', 230000, 270000, 330000, 2150000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-1ve9foa' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-vay-luoi-molly-dress-nau-vay-di-bien-jolie-loft-vay-luoi-molly-dress-n');

-- FLANE 窶・REN C盻・Y蘯ｾM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・REN C盻・Y蘯ｾM', 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4', 'Vﾃ｡y ﾄ訴 bi盻ハ', 200000, 240000, 330000, 1080000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/flane-ren-co-yem-1939b585e2b8.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-flane-ren-co-yem-vay-di-bien-flane-ren-co-yem-1dle7t4-001');

-- JOLIE LOFT 窶・L盻､A
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・L盻､A', 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5', 'Vﾃ｡y ﾄ訴 bi盻ハ', 165000, 195000, 330000, 1320000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-lua-vay-di-bien-jolie-loft-lua-q611c5-001');

-- JOLIE LOFT 窶・Vﾃ〆 REN Cﾃ・TAY
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 REN Cﾃ・TAY', 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf', 'Vﾃ｡y ﾄ訴 bi盻ハ', 190000, 220000, 330000, 1812000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-ren-co-tay-3711af677a87.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-FREESIZE-A', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-jolie-loft-vay-ren-co-tay-vay-di-bien-jolie-loft-vay-ren-co-tay-zi6pwf-001');

-- FLANE 窶・REN B盻・Mﾃ僮 TR蘯ｺ VAI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'flane' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'FLANE 窶・REN B盻・Mﾃ僮 TR蘯ｺ VAI', 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0', 'Vﾃ｡y ﾄ訴 bi盻ハ', 165000, 195000, 340000, 1006500, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/flane-ren-bo-mui-tre-vai-de0c667f796d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-FREESIZE-AS', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-flane-ren-bo-mui-tre-vai-vay-di-bien-flane-ren-bo-mui-tre-vai-1d1b3z0-001');

-- AMELIE 窶・Vﾃ〆 Bﾃ・BABYDOLL C盻・Y蘯ｾM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・Vﾃ〆 Bﾃ・BABYDOLL C盻・Y蘯ｾM', 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg', 'Vﾃ｡y ﾄ訴 bi盻ハ', 140000, 170000, 340000, 870000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vay-bi-babydoll-co-yem-52e248e5a8ed.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-FR', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-00', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-amelie-vay-bi-babydoll-co-yem-vay-di-bien-amelie-vay-bi-babydoll-co-yem-pep3hg-00');

-- Vﾃ〆 REN PH盻蝕 Tﾆ
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Vﾃ〆 REN PH盻蝕 Tﾆ', 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e', 'Vﾃ｡y ﾄ訴 bi盻ハ', 100000, 130000, 330000, 680000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/vay-ren-phoi-to-558d4ffd5f68.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-vay-ren-phoi-to-vay-di-bien-vay-ren-phoi-to-1f5jr2e-001');

-- AMELIEE 窶・GARMENT
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIEE 窶・GARMENT', 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq', 'Vﾃ｡y ﾄ訴 bi盻ハ', 140000, 175000, 340000, 888000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/ameliee-garment-ccde6967b35d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-ameliee-garment-vay-di-bien-ameliee-garment-11m6igq-001');

-- AMELIEE 窶・DIVA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIEE 窶・DIVA', 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf', 'Vﾃ｡y ﾄ訴 bi盻ハ', 150000, 190000, 340000, 960000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/ameliee-diva-ac220ddca95e.webp', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/ameliee-diva-ac220ddca95e.webp');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-ameliee-diva-vay-di-bien-ameliee-diva-ifg3xf-001');

-- MAISON LONG 窶・TH盻ｦY M盻・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'maison-long' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'MAISON LONG 窶・TH盻ｦY M盻・, 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7', 'Vﾃ｡y ﾄ訴 bi盻ハ', 190000, 230000, 350000, 1250000, 750000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/maison-long-thuy-mi-ba34b0b11855.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-maison-long-thuy-mi-vay-di-bien-maison-long-thuy-mi-hyfev7-001');

-- Vﾃ〆 HOA Mﾃ僊 Hﾃ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Vﾃ〆 HOA Mﾃ僊 Hﾃ・, 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42', 'Vﾃ｡y ﾄ訴 bi盻ハ', 90000, 120000, 330000, 594000, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/vay-hoa-mua-he-d401aad8191e.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-vay-hoa-mua-he-vay-di-bien-vay-hoa-mua-he-atur42-001');

-- SET Vﾃ〆 2 Dﾃ・ + CHﾃ・ Vﾃ〆 TR蘯ｮNG KEM LANNIE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-di-bien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'SET Vﾃ〆 2 Dﾃ・ + CHﾃ・ Vﾃ〆 TR蘯ｮNG KEM LANNIE', 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x', 'Vﾃ｡y ﾄ訴 bi盻ハ', 100000, 120000, 330000, 650000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-1m0b65x' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/set-vay-2-day-chan-vay-trang-kem-lannie-6f9b34578bac.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-di-bien-set-vay-2-day-chan-vay-trang-kem-lannie-vay-di-bien-set-vay-2-day-chan-vay-trang-');

-- Sﾃ・VINTAGE 窶・NATHALIA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・NATHALIA', 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5', 'Vﾃ｡y d盻ｱ ti盻㌘', 490000, 560000, 350000, 3620000, 2000000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-nathalia-dd392dda95e4.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-nathalia-vay-du-tiec-so-vintage-nathalia-llfhl5-001');

-- TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'TIPBLU 窶・ﾄ雪ｺｦM VOAN Tﾃ庚 LAVENDER', 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm', 'Vﾃ｡y d盻ｱ ti盻㌘', 160000, 190000, 330000, 930000, 650000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/tipblu-dam-voan-tim-lavender-04c915896be0.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-FREE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-tipblu-am-voan-tim-lavender-vay-du-tiec-tipblu-dam-voan-tim-lavender-1guk5xm-001');

-- JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS', 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z', 'Vﾃ｡y d盻ｱ ti盻㌘', 175000, 200000, 330000, 1600000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1izut8z' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-am-lua-kem-hali-dress-vay-du-tiec-jolie-loft-dam-lua-kem-hali-dress-1i');

-- CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM REN NUDE Dﾃ¨G DﾃI', 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet', 'Vﾃ｡y d盻ｱ ti盻㌘', 225000, 255000, 330000, 1110000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/chou-chou-dam-ren-nude-dang-dai-bb93b72ae214.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-F', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-0', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-chouchou-am-ren-nude-dang-dai-vay-du-tiec-chouchou-dam-ren-nude-dang-dai-ii7pet-0');

-- AMELIE 窶・VANESSA DRESS XANH NH蘯T
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'ameliee' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'AMELIE 窶・VANESSA DRESS XANH NH蘯T', 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu', 'Vﾃ｡y d盻ｱ ti盻㌘', 250000, 290000, 340000, 1530000, 900000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/amelie-vanessa-dress-xanh-nhat-f3db7d3e4f8a.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-vay-du-tiec-amelie-vanessa-dress-xanh-nhat-z6h2gu-');

-- JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 Lﾆｯ盻唔 MOLLY DRESS Nﾃ６', 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi', 'Vﾃ｡y d盻ｱ ti盻㌘', 230000, 270000, 330000, 2150000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-ig33oi' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-vay-luoi-molly-dress-nau-d92038751836.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-nau-vay-du-tiec-jolie-loft-vay-luoi-molly-dress-n');

-- Sﾃ・VINTAGE 窶・LYRA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・LYRA', 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px', 'Vﾃ｡y d盻ｱ ti盻㌘', 388000, 420000, 350000, 2388000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-lyra-9e14be9fc742.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-lyra-vay-du-tiec-so-vintage-lyra-pyr7px-001');

-- WONDER HOUSE 窶・LUA DRESS KEM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'WONDER HOUSE 窶・LUA DRESS KEM', 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py', 'Vﾃ｡y d盻ｱ ti盻㌘', 165000, 190000, 330000, 795000, 500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-FREESIZE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-wonder-house-lua-dress-kem-vay-du-tiec-wonder-house-lua-dress-kem-rda8py-001');

-- Sﾃ・VINTAGE 窶・VELIA (ﾄ職N)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIA (ﾄ職N)', 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2', 'Vﾃ｡y d盻ｱ ti盻㌘', 390000, 440000, 350000, 2590000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-velia-den-497b75ce734f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-velia-en-vay-du-tiec-so-vintage-velia-den-1ji4oa2-001');

-- Sﾃ・VINTAGE 窶・VELIANA (ﾄ職N)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIANA (ﾄ職N)', 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5', 'Vﾃ｡y d盻ｱ ti盻㌘', 290000, 340000, 350000, 1969000, 1300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-veliana-den-89e3bccbb579.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-veliana-en-vay-du-tiec-so-vintage-veliana-den-uzwso5-001');

-- CHOUCHOU 窶・ﾄ雪ｺｦM DﾃI REN CHOﾃNG
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chouchou' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'CHOUCHOU 窶・ﾄ雪ｺｦM DﾃI REN CHOﾃNG', 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw', 'Vﾃ｡y d盻ｱ ti盻㌘', 200000, 230000, 330000, 990000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/chouchou-dam-dai-ren-choang-345fd9ebe974.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-FREESIZ', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-chouchou-am-dai-ren-choang-vay-du-tiec-chouchou-dam-dai-ren-choang-tg9ixw-001');

-- Sﾃ・VINTAGE 窶・VELIA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIA', 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6', 'Vﾃ｡y d盻ｱ ti盻㌘', 390000, 440000, 350000, 2590000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-velia-3ec75e026681.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-velia-vay-du-tiec-so-vintage-velia-y1vsf6-001');

-- Sﾃ・VINTAGE 窶・LAFINE
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・LAFINE', 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4', 'Vﾃ｡y d盻ｱ ti盻㌘', 400000, 450000, 350000, 2629000, 1500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-lafine-2f073b76c8e4.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-lafine-vay-du-tiec-so-vintage-lafine-8x79h4-001');

-- Sﾃ・VINTAGE 窶・VELIANA
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'so-vintage' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Sﾃ・VINTAGE 窶・VELIANA', 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7', 'Vﾃ｡y d盻ｱ ti盻㌘', 290000, 340000, 350000, 1969000, 1300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/so-vintage-veliana-651d05688ec4.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-so-vintage-veliana-vay-du-tiec-so-vintage-veliana-1tczsa7-001');

-- JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS', 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c', 'Vﾃ｡y d盻ｱ ti盻㌘', 210000, 240000, 330000, 1890000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-jolie-loft-vay-lua-luala-dress-vay-du-tiec-jolie-loft-vay-lua-luala-dress-dyy77c-');

-- HﾆｯﾆNG BOUTIQUE 窶・LOUISE LACE DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-du-tiec' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'huong-boutique' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'HﾆｯﾆNG BOUTIQUE 窶・LOUISE LACE DRESS', 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut', 'Vﾃ｡y d盻ｱ ti盻㌘', 380000, 420000, 350000, 2050000, 1400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b0ut' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/huong-boutique-louise-lace-dress-1be1361fc923.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-du-tiec-huong-boutique-louise-lace-dress-vay-du-tiec-huong-boutique-louise-lace-dress-y2b');

-- Tﾃ唔 NHUNG ﾄ職N D.CHIC
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'd-chic' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 NHUNG ﾄ職N D.CHIC', 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8', 'Ph盻･ ki盻㌻', 60000, 80000, 320000, 980000, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-nhung-den-dchic-9d2e3d1a6c98.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-nhung-en-d-chic-phu-kien-tui-nhung-den-dchic-ga4mx8-001');

-- Tﾃ唔 DA ﾄ職N MYS.P
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'mys-p' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 DA ﾄ職N MYS.P', 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz', 'Ph盻･ ki盻㌻', 70000, 90000, 320000, 590000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-da-den-mysp-5db7212e7337.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-da-en-mys-p-phu-kien-tui-da-den-mysp-1dy6iz-001');

-- Tﾃ唔 DA ﾄ雪ｻ・SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 DA ﾄ雪ｻ・, 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3', 'Ph盻･ ki盻㌻', 50000, 70000, 310000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-da-do-ac94ff1d6b71.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-da-do-ac94ff1d6b71.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-da-o-phu-kien-tui-da-do-1hprfk3-001');

-- Tﾃ唔 TR盻ｨNG NG盻靴 TRAI
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 TR盻ｨNG NG盻靴 TRAI', 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d', 'Ph盻･ ki盻㌻', 100000, 120000, 330000, NULL, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-trung-ngoc-trai-56969992dfbf.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-trung-ngoc-trai-phu-kien-tui-trung-ngoc-trai-1vjmm0d-001');

-- COMBO PH盻､ KI盻・ ﾃ＾ DﾃI (Vﾃ誰G + B盻廴 + Tﾃ唔)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chiron' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'COMBO PH盻､ KI盻・ ﾃ＾ DﾃI (Vﾃ誰G + B盻廴 + Tﾃ唔)', 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/com-bo-phu-kien-ao-dai-14d0ec771a02.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-FREESIZE-', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-combo-phu-kien-ao-dai-vong-bom-tui-phu-kien-com-bo-phu-kien-ao-dai-1gzwtn0-001');

-- COMBO NG盻靴 TRAI (Tﾃ唔 + Vﾃ誰G C盻・ Tﾃ唔 + B盻廴/Vﾃ誰G TAY)
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'chiron' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'COMBO NG盻靴 TRAI (Tﾃ唔 + Vﾃ誰G C盻・ Tﾃ唔 + B盻廴/Vﾃ誰G TAY)', 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, NULL, 300000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/combo-ngoc-trai-852e46f9db0f.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-FREESI', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-combo-ngoc-trai-tui-vong-co-tui-bom-vong-tay-phu-kien-combo-ngoc-trai-16poe5w-001');

-- Tﾃ唔 Mﾅｨ ﾄ蝕 BI盻・
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'phu-kien' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'Tﾃ唔 Mﾅｨ ﾄ蝕 BI盻・', 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr', 'Ph盻･ ki盻㌻', 80000, 100000, 320000, 500000, 400000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/phu-kien/tui-mu-di-bien-41a286f65c0d.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-phu-kien-tui-mu-i-bien-phu-kien-tui-mu-di-bien-1731mbr-001');

-- JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・ﾄ雪ｺｦM L盻､A KEM HALI DRESS', 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt', 'Vﾃ｡y l盻･a', 175000, 200000, 330000, 1600000, 600000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-dam-lua-kem-hali-dress-44d474fd0419.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-FR', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-00', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-am-lua-kem-hali-dress-vay-lua-jolie-loft-dam-lua-kem-hali-dress-1ot7kqt-00');

-- WONDER HOUSE 窶・LUA DRESS KEM
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'khac' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'WONDER HOUSE 窶・LUA DRESS KEM', 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc', 'Vﾃ｡y l盻･a', 165000, 190000, 330000, 795000, 500000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/wonder-house-lua-dress-kem-2b53e05ea2bd.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-FREESIZE-ASSORTE', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-wonder-house-lua-dress-kem-vay-lua-wonder-house-lua-dress-kem-fiadoc-001');

-- JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・Vﾃ〆 L盻､A LUALA DRESS', 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3', 'Vﾃ｡y l盻･a', 210000, 240000, 330000, 1890000, 800000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-du-tiec/jolie-loft-vay-lua-luala-dress-1e3a1a9cd26e.png');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-FREESIZE-ASSORT', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-vay-lua-luala-dress-vay-lua-jolie-loft-vaylua-dress-1o6ik3-001');

-- JOLIE LOFT 窶・L盻､A
SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = 'vay-lua' LIMIT 1);
SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = 'jolie-loft' LIMIT 1);

INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)
SELECT @dorentme_seed_shop_id, @dorentme_brand_id, 'JOLIE LOFT 窶・L盻､A', 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj', 'Vﾃ｡y l盻･a', 165000, 195000, 330000, 1320000, 700000, NULL, 0, 0, 1, UTC_TIMESTAMP()
WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj');

SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = 'vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj' LIMIT 1);

INSERT INTO ProductCategories (ProductId, CategoryId)
SELECT @dorentme_product_id, @dorentme_category_id
WHERE @dorentme_product_id IS NOT NULL
  AND @dorentme_category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM ProductCategories
    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id
  );

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)
SELECT @dorentme_product_id, 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg', CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = 'products/vay-di-bien/jolie-loft-lua-540f8a0c0d21.jpg');

INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)
SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-FREESIZE-ASSORTED', 1, UTC_TIMESTAMP()
WHERE @dorentme_product_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED');

SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);

INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)
SELECT @dorentme_variant_id, 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-001', 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()
WHERE @dorentme_variant_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = 'LEGACY-vay-lua-jolie-loft-lua-vay-lua-jolie-loft-lua-1ewpzgj-001');

COMMIT;

-- Seeded products: 52
-- Seeded categories: 5
-- Seeded brands: 12
```

## `tools/catalog/generate-legacy-catalog-seed.js`

```js
import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assetMap from '../../frontend/src/assets/asset-map.json' with { type: 'json' };
import { products } from '../../frontend/src/features/catalog/data/products.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const defaultOutputPath = resolve(__dirname, '../../database/seed-legacy-catalog.mysql.sql');
const outputArg = process.argv.find((arg) => arg.startsWith('--out='));
const outputPath = outputArg ? resolve(process.cwd(), outputArg.slice('--out='.length)) : defaultOutputPath;

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';
}

function sqlString(value) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }

  return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

function parsePrice(value) {
  if (!value) return null;
  const digits = String(value).replace(/[^\d]/g, '');
  return digits ? Number.parseInt(digits, 10) : null;
}

function parseExtraDayPrice(value) {
  return parsePrice(value) || 0;
}

function uniqueBy(items, keySelector) {
  const seen = new Set();
  return items.filter((item) => {
    const key = keySelector(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const categories = uniqueBy(
  products.map((product) => ({
    name: product.categoryLabel,
    slug: product.category,
  })),
  (category) => category.slug,
).sort((left, right) => left.slug.localeCompare(right.slug));

const brands = uniqueBy(
  products.map((product) => ({
    name: product.brand || 'Khac',
    slug: slugify(product.brand || 'Khac'),
  })),
  (brand) => brand.slug,
).sort((left, right) => left.slug.localeCompare(right.slug));

const lines = [
  '-- Generated by tools/catalog/generate-legacy-catalog-seed.js',
  '-- Idempotent MySQL seed for the legacy DoRentMe catalog.',
  '-- Review @dorentme_seed_* variables before running against production.',
  '',
  'START TRANSACTION;',
  '',
  "SET @dorentme_seed_owner_email = 'catalog-seed@dorentme.local';",
  "SET @dorentme_seed_shop_name = 'DoRentMe Catalog Seed Shop';",
  'SET @dorentme_seed_shop_id = (SELECT Id FROM Shops WHERE IsActive = 1 ORDER BY Id LIMIT 1);',
  '',
  "INSERT INTO Roles (Code, Name, Description, CreatedAt)",
  "SELECT 'LENDER', 'Lender', 'Lender role', UTC_TIMESTAMP()",
  "WHERE NOT EXISTS (SELECT 1 FROM Roles WHERE Code = 'LENDER');",
  '',
  'SET @dorentme_lender_role_id = (SELECT Id FROM Roles WHERE Code = \'LENDER\' LIMIT 1);',
  '',
  'INSERT INTO Users (RoleId, Name, Email, Phone, PasswordHash, LoyaltyPoints, IsActive, CreatedAt)',
  "SELECT @dorentme_lender_role_id, 'Catalog Seed Owner', @dorentme_seed_owner_email, NULL, 'SEEDED_DISABLED_LOGIN', 0, 0, UTC_TIMESTAMP()",
  'WHERE @dorentme_seed_shop_id IS NULL',
  '  AND NOT EXISTS (SELECT 1 FROM Users WHERE Email = @dorentme_seed_owner_email);',
  '',
  'SET @dorentme_seed_owner_id = (SELECT Id FROM Users WHERE Email = @dorentme_seed_owner_email LIMIT 1);',
  '',
  'INSERT INTO Shops (Name, OwnerUserId, Phone, Email, Address, IsActive, CreatedAt)',
  "SELECT @dorentme_seed_shop_name, @dorentme_seed_owner_id, '0000000000', @dorentme_seed_owner_email, 'Seeded catalog shop', 1, UTC_TIMESTAMP()",
  'WHERE @dorentme_seed_shop_id IS NULL',
  '  AND NOT EXISTS (SELECT 1 FROM Shops WHERE Name = @dorentme_seed_shop_name);',
  '',
  'SET @dorentme_seed_shop_id = COALESCE(@dorentme_seed_shop_id, (SELECT Id FROM Shops WHERE Name = @dorentme_seed_shop_name LIMIT 1));',
  '',
];

for (const category of categories) {
  lines.push(
    'INSERT INTO Categories (Name, Slug, IsActive, CreatedAt)',
    `SELECT ${sqlString(category.name)}, ${sqlString(category.slug)}, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Categories WHERE Slug = ${sqlString(category.slug)});`,
    '',
  );
}

for (const brand of brands) {
  lines.push(
    'INSERT INTO Brands (Name, Slug, IsActive, CreatedAt)',
    `SELECT ${sqlString(brand.name)}, ${sqlString(brand.slug)}, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Brands WHERE Slug = ${sqlString(brand.slug)});`,
    '',
  );
}

for (const product of products) {
  const productSlug = slugify(`${product.category}-${product.name}-${product.id}`);
  const categorySlug = product.category;
  const brandSlug = slugify(product.brand || 'Khac');
  const price1Day = parsePrice(product.price1day) || 0;
  const price3Day = parsePrice(product.price3day) || price1Day;
  const extraDayPrice = parseExtraDayPrice(product.priceExtra);
  const priceTag = parsePrice(product.priceTag);
  const priceDeposit = parsePrice(product.priceDeposit) || 0;
  const imageUrl = assetMap[product.image] || product.image;
  const variantCode = `LEGACY-${productSlug}-FREESIZE-ASSORTED`.slice(0, 100);
  const assetCode = `LEGACY-${productSlug}-001`.slice(0, 100);

  lines.push(
    `-- ${product.name}`,
    'SET @dorentme_category_id = (SELECT Id FROM Categories WHERE Slug = ' + sqlString(categorySlug) + ' LIMIT 1);',
    'SET @dorentme_brand_id = (SELECT Id FROM Brands WHERE Slug = ' + sqlString(brandSlug) + ' LIMIT 1);',
    '',
    'INSERT INTO Products (ShopId, BrandId, Name, Slug, Description, Price1Day, Price3Day, ExtraDayPrice, PriceTag, PriceDeposit, PurchaseCost, CleaningCost, MaintenanceCost, IsActive, CreatedAt)',
    `SELECT @dorentme_seed_shop_id, @dorentme_brand_id, ${sqlString(product.name)}, ${sqlString(productSlug)}, ${sqlString(product.categoryLabel)}, ${price1Day}, ${price3Day}, ${extraDayPrice}, ${priceTag ?? 'NULL'}, ${priceDeposit}, NULL, 0, 0, 1, UTC_TIMESTAMP()`,
    `WHERE NOT EXISTS (SELECT 1 FROM Products WHERE Slug = ${sqlString(productSlug)});`,
    '',
    `SET @dorentme_product_id = (SELECT Id FROM Products WHERE Slug = ${sqlString(productSlug)} LIMIT 1);`,
    '',
    'INSERT INTO ProductCategories (ProductId, CategoryId)',
    'SELECT @dorentme_product_id, @dorentme_category_id',
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND @dorentme_category_id IS NOT NULL',
    '  AND NOT EXISTS (',
    '    SELECT 1 FROM ProductCategories',
    '    WHERE ProductId = @dorentme_product_id AND CategoryId = @dorentme_category_id',
    '  );',
    '',
    'INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, SortOrder, CreatedAt)',
    `SELECT @dorentme_product_id, ${sqlString(imageUrl)}, CASE WHEN EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND IsPrimary = 1) THEN 0 ELSE 1 END, 0, UTC_TIMESTAMP()`,
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND NOT EXISTS (SELECT 1 FROM ProductImages WHERE ProductId = @dorentme_product_id AND ImageUrl = ' + sqlString(imageUrl) + ');',
    '',
    'INSERT INTO ProductVariants (ProductId, Size, Color, VariantCode, IsActive, CreatedAt)',
    `SELECT @dorentme_product_id, 'FREESIZE', 'ASSORTED', ${sqlString(variantCode)}, 1, UTC_TIMESTAMP()`,
    'WHERE @dorentme_product_id IS NOT NULL',
    '  AND NOT EXISTS (SELECT 1 FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = \'FREESIZE\' AND Color = \'ASSORTED\');',
    '',
    `SET @dorentme_variant_id = (SELECT Id FROM ProductVariants WHERE ProductId = @dorentme_product_id AND Size = 'FREESIZE' AND Color = 'ASSORTED' LIMIT 1);`,
    '',
    'INSERT INTO ProductInventoryItems (ProductVariantId, AssetCode, `Condition`, Status, Notes, CreatedAt)',
    `SELECT @dorentme_variant_id, ${sqlString(assetCode)}, 'GOOD', 'AVAILABLE', 'Seeded from legacy frontend catalog', UTC_TIMESTAMP()`,
    'WHERE @dorentme_variant_id IS NOT NULL',
    `  AND NOT EXISTS (SELECT 1 FROM ProductInventoryItems WHERE AssetCode = ${sqlString(assetCode)});`,
    '',
  );
}

lines.push(
  'COMMIT;',
  '',
  `-- Seeded products: ${products.length}`,
  `-- Seeded categories: ${categories.length}`,
  `-- Seeded brands: ${brands.length}`,
);

writeFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');

console.log(`Generated ${outputPath}`);
console.log(`products=${products.length}`);
console.log(`categories=${categories.length}`);
console.log(`brands=${brands.length}`);
```

## `tools/catalog/README.md`

```md
# Catalog Seed

Generate an idempotent MySQL seed file from the legacy frontend catalog:

```bash
node tools/catalog/generate-legacy-catalog-seed.js
```

The generated SQL is written to:

```text
database/seed-legacy-catalog.mysql.sql
```

Before running it against production, review the variables at the top of the SQL.
By default it uses the first active shop. If no active shop exists, it creates a
disabled seed owner and a catalog seed shop so product visibility still works.

Image URLs are generated from `frontend/src/assets/asset-map.json` when a mapping
exists. Otherwise the original legacy image path is kept and can be replaced later.
```

## `frontend/scripts/validate-catalog.js`

```js
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
```

## `frontend/scripts/check-cutover-readiness.js`

```js
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
```

