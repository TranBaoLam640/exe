import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { getSession } from '../features/auth/authService.js';
import { CART_CHANGED_EVENT, CART_KEY, clearCart, formatVnd, getCart, getCartTotals, parsePrice } from '../features/cart/cartService.js';
import { createCheckoutOrder, genOrderId } from '../features/orders/orderCreation.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const BANK_CODE = 'TCB';
const BANK_NAME = 'Techcombank';
const ACCOUNT_NO = '19071688314017';
const ACCOUNT_NAME = 'TRAN BAO LAM';

function readCheckoutCart() {
  const items = getCart();
  return { items, totals: getCartTotals(items) };
}

export default function CheckoutPage() {
  useDocumentTitle('Thanh Toán | DoRentMe');
  const session = getSession();
  const draftIdRef = useRef(genOrderId());
  const [cartState, setCartState] = useState(readCheckoutCart);
  const [customer, setCustomer] = useState({
    name: session?.name || '',
    phone: session?.phone || '',
    address: '',
    note: '',
  });
  const [invalid, setInvalid] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const update = () => setCartState(readCheckoutCart());
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

  const qrNote = `${draftIdRef.current} DoRentMe`;
  const qrUrl = useMemo(() => {
    const base = `https://img.vietqr.io/image/${BANK_CODE}-${ACCOUNT_NO}-compact2.png`;
    return `${base}?amount=${cartState.totals.total}&addInfo=${encodeURIComponent(qrNote)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;
  }, [cartState.totals.total, qrNote]);

  function updateField(field, value) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function validate() {
    const cleanCustomer = {
      name: customer.name.trim(),
      phone: customer.phone.trim(),
      address: customer.address.trim(),
      note: customer.note.trim(),
    };
    const nextInvalid = {
      name: cleanCustomer.name.length < 2,
      phone: !/^[0-9]{9,11}$/.test(cleanCustomer.phone.replace(/[\s.\-]/g, '')),
      address: cleanCustomer.address.length < 5,
    };

    setInvalid(nextInvalid);
    return Object.values(nextInvalid).some(Boolean) ? null : cleanCustomer;
  }

  function confirmPayment() {
    const cleanCustomer = validate();
    if (!cleanCustomer) return;

    setSubmitting(true);
    const latestItems = getCart();
    if (latestItems.length === 0) {
      setCartState(readCheckoutCart());
      setSubmitting(false);
      return;
    }

    const latestTotals = getCartTotals(latestItems);
    const currentSession = getSession();
    createCheckoutOrder({
      id: draftIdRef.current,
      items: latestItems,
      customer: cleanCustomer,
      totals: latestTotals,
      customerEmail: currentSession ? currentSession.email : null,
    });
    clearCart();
    window.location.href = `/order-tracking.html?id=${encodeURIComponent(draftIdRef.current)}`;
  }

  function copyAccount() {
    navigator.clipboard?.writeText(ACCOUNT_NO).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  if (cartState.items.length === 0) {
    return (
      <div className="checkout-page">
        <div className="checkout-head">
          <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/cart">Giỏ hàng</Link> › <span>Thanh toán</span></div>
          <h1>💳 Thanh toán đơn thuê</h1>
        </div>
        <div className="checkout-empty">
          <div className="checkout-empty-icon">🛒</div>
          <h2>Giỏ hàng đang trống</h2>
          <p>Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán.</p>
          <Link to="/shop">Đến Shop →</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-head">
        <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/cart">Giỏ hàng</Link> › <span>Thanh toán</span></div>
        <h1>💳 Thanh toán đơn thuê</h1>
      </div>

      <div className="checkout-layout">
        <div>
          <section className="checkout-panel">
            <h3>📍 Thông tin nhận đồ</h3>
            <div className={`checkout-form-row ${invalid.name ? 'invalid' : ''}`}>
              <label htmlFor="checkoutName">Họ và tên <span>*</span></label>
              <input id="checkoutName" onChange={(event) => updateField('name', event.target.value)} placeholder="Nguyễn Văn A" type="text" value={customer.name} />
              <div className="checkout-error">Vui lòng nhập họ tên</div>
            </div>
            <div className={`checkout-form-row ${invalid.phone ? 'invalid' : ''}`}>
              <label htmlFor="checkoutPhone">Số điện thoại <span>*</span></label>
              <input id="checkoutPhone" onChange={(event) => updateField('phone', event.target.value)} placeholder="09xxxxxxxx" type="tel" value={customer.phone} />
              <div className="checkout-error">Vui lòng nhập số điện thoại hợp lệ (9-11 số)</div>
            </div>
            <div className={`checkout-form-row ${invalid.address ? 'invalid' : ''}`}>
              <label htmlFor="checkoutAddress">Địa chỉ nhận đồ <span>*</span></label>
              <textarea id="checkoutAddress" onChange={(event) => updateField('address', event.target.value)} placeholder="Số nhà, đường, phường/xã, quận/huyện..." value={customer.address} />
              <div className="checkout-error">Vui lòng nhập địa chỉ nhận đồ</div>
            </div>
            <div className="checkout-form-row">
              <label htmlFor="checkoutNote">Ghi chú (tuỳ chọn)</label>
              <textarea id="checkoutNote" onChange={(event) => updateField('note', event.target.value)} placeholder="Giờ nhận hàng mong muốn, ghi chú khác..." value={customer.note} />
            </div>
          </section>

          <section className="checkout-panel">
            <h3>🧾 Sản phẩm ({cartState.totals.qty})</h3>
            {cartState.items.map((item) => {
              const qty = Number(item.qty) || 1;
              return (
                <div className="checkout-item" key={item.name}>
                  <img
                    alt={item.name}
                    onError={(event) => {
                      event.currentTarget.removeAttribute('src');
                    }}
                    src={imageUrl(item.image)}
                  />
                  <div className="checkout-item-info">
                    <div className="checkout-item-name">{item.name}</div>
                    <div className="checkout-item-sub">SL: {qty} × {item.price3day}</div>
                  </div>
                  <div className="checkout-item-price">{formatVnd(parsePrice(item.price3day) * qty)}</div>
                </div>
              );
            })}
          </section>
        </div>

        <div>
          <section className="checkout-panel">
            <h3>Tóm tắt thanh toán</h3>
            <div className="sum-row"><span>Tiền thuê (gói 3 ngày)</span><strong>{formatVnd(cartState.totals.rent)}</strong></div>
            <div className="sum-row"><span>Tiền cọc (hoàn lại)</span><strong>{formatVnd(cartState.totals.deposit)}</strong></div>
            <div className="sum-row sum-total">
              <span className="lbl">Cần chuyển khoản</span>
              <span className="val">{formatVnd(cartState.totals.total)}</span>
            </div>
          </section>

          <section className="checkout-panel checkout-qr-box">
            <h3>💳 Quét mã để thanh toán</h3>
            <img
              alt="QR chuyển khoản DoRentMe"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
              src={qrUrl}
            />
            <div className="checkout-qr-info">
              <div>Ngân hàng: <b>{BANK_NAME}</b></div>
              <div className="copy-row">
                <span>Số TK: <b>{ACCOUNT_NO}</b></span>
                <button className="copy-btn" onClick={copyAccount} type="button">{copied ? 'Đã chép!' : 'Sao chép'}</button>
              </div>
              <div>Chủ TK: <b>{ACCOUNT_NAME}</b></div>
              <div>Số tiền: <b>{formatVnd(cartState.totals.total)}</b></div>
              <div>Nội dung CK: <b>{qrNote}</b></div>
            </div>
            <div className="order-code-note">⚠️ Vui lòng nhập đúng nội dung chuyển khoản ở trên để shop đối chiếu và xác nhận đơn nhanh nhất.</div>
            <button className="btn-confirm-pay" disabled={submitting} onClick={confirmPayment} type="button">
              {submitting ? 'Đang xử lý...' : '✅ Tôi đã thanh toán, xác nhận đặt thuê'}
            </button>
            <p className="pay-note">Sau khi bấm xác nhận, đơn của bạn sẽ ở trạng thái "Chờ xác nhận" cho đến khi shop kiểm tra giao dịch. Bạn có thể theo dõi đơn trong mục 📦 Đơn hàng.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
