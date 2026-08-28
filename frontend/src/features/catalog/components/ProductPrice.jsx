export default function ProductPrice({ product, variant = 'card' }) {
  if (variant === 'detail') {
    return (
      <div className="catalog-price-box">
        <div className="catalog-price-row">
          <span className="catalog-price-label">Giá thuê 3 ngày:</span>
          <span className="catalog-price-value">{product.price3day}</span>
        </div>
        <div className="catalog-price-note">{product.priceExtra}</div>
        <div className="catalog-price-row secondary">
          <span className="catalog-price-label">Giá thuê 1 ngày:</span>
          <span className="catalog-price-value">{product.price1day}</span>
        </div>
        <div className="catalog-price-row tag">
          <span className="catalog-price-label">Giá tag:</span>
          <span className="catalog-price-value">{product.priceTag}</span>
        </div>
        <div className="catalog-price-row deposit">
          <span className="catalog-price-label">Giá cọc:</span>
          <span className="catalog-price-value">{product.priceDeposit}</span>
        </div>
      </div>
    );
  }

  if (variant === 'home') {
    return (
      <ul className="catalog-price-list">
        <li className="highlight">Giá thuê 3 ngày: {product.price3day}</li>
        <li className="muted">{product.priceExtra}</li>
        <li>Giá thuê 1 ngày: {product.price1day}</li>
        <li>Giá tag: {product.priceTag}</li>
        <li>Giá cọc: {product.priceDeposit}</li>
      </ul>
    );
  }

  return (
    <div className="catalog-card-price">
      Giá thuê 3 ngày: <strong>{product.price3day}</strong><br />
      <span className="extra">{product.priceExtra}</span><br />
      Giá thuê 1 ngày: <strong>{product.price1day}</strong><br />
      <span className="red">Giá tag: {product.priceTag}</span><br />
      <span className="red">Giá cọc: {product.priceDeposit}</span>
    </div>
  );
}
