import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import {
  CART_CHANGED_EVENT,
  CART_KEY,
  clearCart,
  countCartItems,
  decrementCartItem,
  formatVnd,
  getCart,
  getCartTotals,
  parsePrice,
  removeCartItem,
  setCartItemQty,
} from '../features/cart/cartService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

function readCartState() {
  const items = getCart();
  return { items, totals: getCartTotals(items), count: countCartItems(items) };
}

export default function CartPage() {
  useDocumentTitle('Giỏ Hàng | DoRentMe');
  const [state, setState] = useState(readCartState);

  useEffect(() => {
    const update = () => setState(readCartState());
    const onStorage = (event) => {
      if (event.key === CART_KEY) update();
    };

    document.addEventListener(CART_CHANGED_EVENT, update);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener(CART_CHANGED_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  function clearAll() {
    if (window.confirm('Xóa toàn bộ sản phẩm trong giỏ?')) {
      clearCart();
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-head">
          <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/shop">Shop</Link> › <span>Giỏ hàng</span></div>
          <h1>🛒 Giỏ hàng của bạn</h1>
          <p>Giỏ hàng đang trống.</p>
        </div>
        <div className="cart-empty">
          <div className="cart-empty-icon">🧺</div>
          <h2>Chưa có sản phẩm nào trong giỏ</h2>
          <p>Hãy khám phá bộ sưu tập và thêm những bộ trang phục bạn yêu thích.</p>
          <Link to="/shop">Bắt đầu mua sắm →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-head">
        <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/shop">Shop</Link> › <span>Giỏ hàng</span></div>
        <h1>🛒 Giỏ hàng của bạn</h1>
        <p>Bạn có {state.count} sản phẩm trong giỏ.</p>
      </div>

      <div className="cart-layout">
        <div className="cart-items">
          {state.items.map((item) => {
            const qty = Number(item.qty) || 1;
            return (
              <article className="cart-item" key={item.name}>
                <img
                  alt={item.name}
                  onError={(event) => {
                    event.currentTarget.removeAttribute('src');
                  }}
                  src={imageUrl(item.image)}
                />
                <div className="ci-info">
                  <div className="ci-name">{item.name}</div>
                  <div className="ci-cat">{item.category}</div>
                  <div className="ci-price">Thuê 3 ngày: {item.price3day}</div>
                  {item.priceDeposit ? <div className="ci-sub">Cọc: {item.priceDeposit}</div> : null}
                </div>
                <div className="ci-right">
                  <div className="cart-qty-selector" aria-label={`Số lượng ${item.name}`}>
                    <button type="button" onClick={() => decrementCartItem(item.name)}>−</button>
                    <span>{qty}</span>
                    <button type="button" onClick={() => setCartItemQty(item.name, qty + 1)}>+</button>
                  </div>
                  <button className="ci-remove" type="button" onClick={() => removeCartItem(item.name)}>🗑 Xóa</button>
                </div>
              </article>
            );
          })}
          <Link className="btn-continue" to="/shop">← Tiếp tục mua sắm</Link>
        </div>

        <aside className="cart-summary">
          <h3>Tóm tắt đơn thuê</h3>
          <div className="sum-row"><span>Số sản phẩm</span><strong>{state.count}</strong></div>
          <div className="sum-row"><span>Tiền thuê (gói 3 ngày)</span><strong>{formatVnd(state.totals.rent)}</strong></div>
          <div className="sum-row"><span>Tiền cọc (hoàn lại)</span><strong>{formatVnd(state.totals.deposit)}</strong></div>
          <div className="sum-row sum-total">
            <span className="lbl">Cần thanh toán</span>
            <span className="val">{formatVnd(state.totals.total)}</span>
          </div>
          <p className="sum-note">Đã gồm tiền cọc {formatVnd(state.totals.deposit)} sẽ được hoàn lại khi bạn trả đồ đúng hạn & nguyên vẹn.</p>
          <Link className="btn-checkout" to="/checkout">Tiến hành đặt thuê</Link>
          <button className="btn-clear" type="button" onClick={clearAll}>Xóa toàn bộ giỏ</button>
        </aside>
      </div>
    </div>
  );
}

export { parsePrice };
