import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { getSession } from '../features/auth/authService.js';
import { CART_CHANGED_EVENT, CART_KEY, clearActiveCart, formatVnd, getActiveCartState, parsePrice } from '../features/cart/cartService.js';
import { checkoutServerCart } from '../features/orders/orderApi.js';
import { createCheckoutOrder, genOrderId } from '../features/orders/orderCreation.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import { getApiErrorMessage } from '../utils/apiError.js';

export default function CheckoutPage() {
  useDocumentTitle('Thanh toán | DoRentMe');
  const session = getSession();
  const draftIdRef = useRef(genOrderId());
  const [cartState, setCartState] = useState({ items: [], totals: { qty: 0, rent: 0, deposit: 0, total: 0 }, source: 'guest' });
  const [customer, setCustomer] = useState({ name: session?.name || '', phone: session?.phone || '', address: '', note: '' });
  const [invalid, setInvalid] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const update = () => getActiveCartState().then(setCartState);
    const onStorage = (event) => { if (event.key === CART_KEY) update(); };
    update();
    document.addEventListener(CART_CHANGED_EVENT, update);
    document.addEventListener('auth:changed', update);
    window.addEventListener('storage', onStorage);
    return () => { document.removeEventListener(CART_CHANGED_EVENT, update); document.removeEventListener('auth:changed', update); window.removeEventListener('storage', onStorage); };
  }, []);

  function updateField(field, value) { setCustomer((current) => ({ ...current, [field]: value })); }

  function validate() {
    const clean = { name: customer.name.trim(), phone: customer.phone.trim(), address: customer.address.trim(), note: customer.note.trim() };
    const nextInvalid = { name: clean.name.length < 2, phone: !/^[0-9]{9,11}$/.test(clean.phone.replace(/[\s.\-]/g, '')), address: clean.address.length < 5 };
    setInvalid(nextInvalid);
    return Object.values(nextInvalid).some(Boolean) ? null : clean;
  }

  async function createOrder() {
    const cleanCustomer = validate();
    if (!cleanCustomer) return;
    setSubmitting(true); setSubmitError('');
    try {
      const latestState = await getActiveCartState();
      if (latestState.items.length === 0) { setCartState(latestState); return; }
      const currentSession = getSession();
      if (latestState.source === 'server' && currentSession?.token) {
        const checkout = await checkoutServerCart({ customer: { ...cleanCustomer, email: currentSession.email } });
        document.dispatchEvent(new CustomEvent(CART_CHANGED_EVENT));
        const firstOrder = checkout.orders?.[0];
        window.location.href = `/orders/${encodeURIComponent(firstOrder?.id || '')}`;
        return;
      }
      createCheckoutOrder({ id: draftIdRef.current, items: latestState.items, customer: cleanCustomer, totals: latestState.totals, customerEmail: currentSession?.email || null });
      await clearActiveCart();
      window.location.href = `/orders/${encodeURIComponent(draftIdRef.current)}`;
    } catch (error) {
      setSubmitError(getApiErrorMessage(error, 'Không thể tạo đơn thuê. Vui lòng kiểm tra lại giỏ hàng.'));
    } finally { setSubmitting(false); }
  }

  if (cartState.items.length === 0) {
    return <div className="checkout-page"><div className="checkout-head"><div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/cart">Giỏ hàng</Link> › <span>Thanh toán</span></div><h1>Thanh toán đơn thuê</h1></div><div className="checkout-empty"><div className="checkout-empty-icon">🛒</div><h2>Giỏ hàng đang trống</h2><p>Bạn cần thêm sản phẩm vào giỏ trước khi thanh toán.</p><Link to="/shop">Đến Shop →</Link></div></div>;
  }

  return <div className="checkout-page"><div className="checkout-head"><div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/cart">Giỏ hàng</Link> › <span>Thanh toán</span></div><h1>Thanh toán đơn thuê</h1></div><div className="checkout-layout"><div><section className="checkout-panel"><h3>📍 Thông tin nhận đồ</h3>{[['name', 'Họ và tên', 'Nguyễn Văn A'], ['phone', 'Số điện thoại', '09xxxxxxxx'], ['address', 'Địa chỉ nhận đồ', 'Số nhà, đường, phường/xã, quận/huyện...']].map(([field, label, placeholder]) => <div className={`checkout-form-row ${invalid[field] ? 'invalid' : ''}`} key={field}><label htmlFor={`checkout-${field}`}>{label} <span>*</span></label>{field === 'address' ? <textarea id={`checkout-${field}`} onChange={(event) => updateField(field, event.target.value)} placeholder={placeholder} value={customer[field]} /> : <input id={`checkout-${field}`} onChange={(event) => updateField(field, event.target.value)} placeholder={placeholder} type={field === 'phone' ? 'tel' : 'text'} value={customer[field]} />}<div className="checkout-error">Vui lòng nhập {label.toLowerCase()} hợp lệ.</div></div>)}<div className="checkout-form-row"><label htmlFor="checkoutNote">Ghi chú (tuỳ chọn)</label><textarea id="checkoutNote" onChange={(event) => updateField('note', event.target.value)} placeholder="Giờ nhận hàng mong muốn, ghi chú khác..." value={customer.note} /></div></section><section className="checkout-panel"><h3>🧾 Sản phẩm ({cartState.totals.qty})</h3>{cartState.items.map((item) => { const qty = Number(item.qty) || 1; return <div className="checkout-item" key={item.name}><img alt={item.name} onError={(event) => event.currentTarget.removeAttribute('src')} src={imageUrl(item.image)} /><div className="checkout-item-info"><div className="checkout-item-name">{item.name}</div><div className="checkout-item-sub">SL: {qty} × {item.price3day}</div></div><div className="checkout-item-price">{formatVnd(parsePrice(item.price3day) * qty)}</div></div>; })}</section></div><div><section className="checkout-panel"><h3>Tóm tắt đơn hàng</h3><div className="sum-row"><span>Tiền thuê</span><strong>{formatVnd(cartState.totals.rent)}</strong></div><div className="sum-row"><span>Tiền cọc (hoàn lại)</span><strong>{formatVnd(cartState.totals.deposit)}</strong></div><div className="sum-row sum-total"><span>Tổng thanh toán</span><span className="val">{formatVnd(cartState.totals.total)}</span></div></section><section className="checkout-panel checkout-payment-note"><h3>Tạo đơn hàng</h3><p>Đơn hàng sẽ được tạo với Payment đang chờ xác nhận. Thông tin chuyển khoản và trạng thái thanh toán sẽ hiển thị trong trang theo dõi đơn.</p><button className="btn-confirm-pay" disabled={submitting} onClick={createOrder} type="button">{submitting ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}</button>{submitError ? <div className="checkout-error" style={{ display: 'block' }}>{submitError}</div> : null}</section></div></div></div>;
}
