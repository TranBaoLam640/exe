import { Link } from 'react-router-dom';
import { imageUrl } from '../../../assets/imageUrl.js';
import ProductPrice from './ProductPrice.jsx';

export default function ProductCard({ product, variant = 'shop', onAdd }) {
  if (variant === 'home') {
    return (
      <article className="catalog-product-card catalog-product-card--home fade-in">
        <span className="catalog-card-badge">new</span>
        <img className="catalog-product-img" src={imageUrl(product.image)} alt={product.name} />
        <div className="catalog-product-info">
          <div className="catalog-product-name">{product.name}</div>
          <ProductPrice product={product} variant="home" />
          <Link to="/shop" className="catalog-btn-rent">Xem thêm</Link>
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
          🛒 Thêm vào giỏ
        </button>
      </div>
    </Link>
  );
}
