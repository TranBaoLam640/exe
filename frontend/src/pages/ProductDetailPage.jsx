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
