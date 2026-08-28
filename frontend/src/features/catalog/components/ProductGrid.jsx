import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, onAdd }) {
  return (
    <div className="catalog-product-grid">
      {products.map((product) => <ProductCard product={product} onAdd={onAdd} key={product.id} />)}
      {products.length === 0 ? (
        <div className="catalog-empty-state">
          <div className="catalog-empty-icon">🛍️</div>
          <p>Không có sản phẩm nào trong danh mục này.</p>
        </div>
      ) : null}
    </div>
  );
}
