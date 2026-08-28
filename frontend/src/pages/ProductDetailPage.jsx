import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { addProductToCart } from '../features/cart/cartService.js';
import { buildTryOnProductUrl } from '../features/ai/tryon/tryOnProduct.js';
import ProductPrice from '../features/catalog/components/ProductPrice.jsx';
import QuantitySelector from '../features/catalog/components/QuantitySelector.jsx';
import { getFallbackProduct, getProductById } from '../features/catalog/services/catalogService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function ProductDetailPage() {
  const { id } = useParams();
  const requestedProduct = getProductById(id);
  const product = requestedProduct || getFallbackProduct();
  const [quantity, setQuantity] = useState(1);
  const [liked, setLiked] = useState(false);
  const displayedLikes = liked ? product.likes + 1 : product.likes;
  const stars = useMemo(() => {
    const count = Math.round(product.rating);
    return '★'.repeat(count) + '☆'.repeat(5 - count);
  }, [product.rating]);
  useDocumentTitle(`${product.name} | DoRentMe`);

  function addToCart() {
    addProductToCart(product, quantity);
  }

  function rentNow() {
    addToCart();
    window.location.href = '/cart';
  }

  return (
    <div className="product-detail-page">
      <div className="product-detail-wrapper">
        <div className="product-breadcrumb">
          <Link to="/">Trang chủ</Link>
          <span className="sep">›</span>
          <Link to="/shop">{product.categoryLabel}</Link>
          <span className="sep">›</span>
          <span>{product.name}</span>
        </div>

        <div className="product-detail">
          <div className="product-left">
            <div className="product-main-image">
              <img src={imageUrl(product.image)} alt={product.name} />
            </div>
            <div className="product-image-actions">
              <button className={`product-like-btn ${liked ? 'liked' : ''}`} type="button" onClick={() => setLiked((value) => !value)}>
                <span className="heart">{liked ? '❤️' : '🤍'}</span>
                <span>{liked ? 'Đã thích' : 'Yêu thích'}</span>
                <strong>{displayedLikes}</strong>
              </button>
              <div className="product-share-btns">
                <a href="#" className="product-share-btn zalo" title="Chia sẻ Zalo">Z</a>
                <a href="#" className="product-share-btn fb" title="Chia sẻ Facebook">f</a>
              </div>
            </div>
          </div>

          <div className="product-right">
            <h1 className="product-title">{product.name}</h1>
            <div className="product-meta">
              <div className="product-rating">
                <span className="product-stars">{stars}</span>
                <span className="product-rating-num">{product.rating.toFixed(1)}</span>
              </div>
              <span className="divider-dot">·</span>
              <span className="product-review-count"><strong>{product.reviews}</strong> đánh giá</span>
              <span className="divider-dot">·</span>
              <span className="product-like-count">
                <span className="heart">♥</span>
                <strong>{product.likes}</strong> lượt thích
              </span>
            </div>

            <ProductPrice product={product} variant="detail" />
            <hr className="product-info-divider" />

            <div className="product-info-row">
              <span className="product-info-row-label">Mã giảm giá</span>
              <div className="product-info-row-content">
                <div className="product-discount-chips">
                  <span className="product-discount-chip">Giảm 5%</span>
                  <span className="product-discount-chip">Giảm 10%</span>
                  <span className="product-discount-chip">Giảm 50K</span>
                  <span className="product-discount-chip">Free ship</span>
                </div>
              </div>
            </div>

            <hr className="product-info-divider" />
            <div className="product-info-row">
              <span className="product-info-row-label">Vận chuyển</span>
              <div className="product-info-row-content">
                <div className="product-shipping-info">
                  <div className="ship-row">
                    <span className="ship-icon">🚚</span>
                    <span>Giao hàng trong <strong>2–3 ngày</strong></span>
                    <span className="ship-free">Miễn phí</span>
                  </div>
                  <div className="ship-note">Tặng voucher 20.000đ nếu giao sau thời gian trên</div>
                </div>
              </div>
            </div>

            <hr className="product-info-divider" />
            <div className="product-info-row">
              <span className="product-info-row-label">An tâm thuê</span>
              <div className="product-info-row-content">
                <div className="product-guarantee-info">
                  <span className="shield">🛡️</span>
                  DoRentMe xử lý · Hoàn tiền nếu có vấn đề · Trả đồ miễn phí 24h
                </div>
              </div>
            </div>

            <hr className="product-info-divider" />
            <div className="product-info-row align-center">
              <span className="product-info-row-label">Số lượng</span>
              <div className="product-info-row-content">
                <QuantitySelector value={quantity} onChange={setQuantity} />
              </div>
            </div>

            <div className="product-action-btns">
              <button className="product-btn-cart" type="button" onClick={addToCart}>🛒 Thêm vào giỏ</button>
              <button className="product-btn-rent-now" type="button" onClick={rentNow}>⚡ Thuê ngay</button>
            </div>
            <Link to={buildTryOnProductUrl(product)} className="product-btn-tryon">🪄 Thử đồ AI với sản phẩm này</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
