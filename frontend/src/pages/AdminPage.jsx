import { useState } from 'react';
import { imageUrl } from '../assets/imageUrl.js';
import { formatVnd } from '../features/cart/cartService.js';
import {
  formatOrderDate,
  markDelivered,
  markReturned,
  removeOrder,
  shopConfirm,
  shopConfirmReturn,
  STATUS_LABELS,
} from '../features/orders/orderCreation.js';
import { useOrders } from '../features/orders/useOrders.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const ADMIN_PASSWORD = 'dorentme2026';
const ADMIN_SESSION_KEY = 'dorentme_admin_ok';

function hasAdminSession() {
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === '1';
}

function orderItemsText(order) {
  return Array.isArray(order.items)
    ? order.items.map((item) => `${item.name} × ${Number(item.qty) || 1}`).join(', ')
    : '';
}

export default function AdminPage() {
  useDocumentTitle('Quản Lý Đơn Hàng | DoRentMe');
  const orders = useOrders();
  const [password, setPassword] = useState('');
  const [denied, setDenied] = useState(false);
  const [unlocked, setUnlocked] = useState(hasAdminSession);

  function tryLogin(event) {
    event.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, '1');
      setUnlocked(true);
      setDenied(false);
      return;
    }
    setDenied(true);
  }

  function confirmOrder(id) {
    const name = window.prompt('Tên shipper (bỏ trống nếu chưa có):', '') || '';
    const phone = name ? window.prompt('SĐT shipper (tuỳ chọn):', '') || '' : '';
    shopConfirm(id, name ? { name, phone } : null);
  }

  function forceReturn(id) {
    if (window.confirm('Đánh dấu đơn này đã trả hàng xong (xử lý ngoài app)?')) {
      markReturned(id);
    }
  }

  function deleteOrder(id) {
    if (window.confirm('Xoá đơn này? Không thể hoàn tác.')) {
      removeOrder(id);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          <h1>DoRentMe · Quản lý đơn hàng</h1>
        </div>
        <span>Nội bộ · Prototype</span>
      </header>

      <div className="admin-warn-banner">
        Trang nội bộ demo: đơn hàng được lưu bằng localStorage của trình duyệt, nên chỉ hiển thị các đơn được tạo ra trên cùng trình duyệt này. Đây chưa phải hệ thống nhiều người dùng thật.
      </div>

      <main className="admin-body">
        {!unlocked ? (
          <form className="admin-gate" onSubmit={tryLogin}>
            <h2>🔐 Đăng nhập quản trị</h2>
            <p>Nhập mật khẩu nội bộ để xem & xử lý đơn hàng.</p>
            <label htmlFor="adminPassword">Mật khẩu</label>
            <input
              id="adminPassword"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Mật khẩu"
              type="password"
              value={password}
            />
            <button type="submit">Vào trang quản lý</button>
            {denied ? <div className="admin-error">Sai mật khẩu, vui lòng thử lại.</div> : null}
          </form>
        ) : orders.length === 0 ? (
          <div className="admin-empty">Chưa có đơn hàng nào trên trình duyệt này.</div>
        ) : (
          orders.map((order) => (
            <article className="admin-order-row" key={order.id}>
              <div className="admin-order-top">
                <div>
                  <div className="admin-order-id">Mã: {order.id}</div>
                  <div className="admin-order-date">{formatOrderDate(order.createdAt)}</div>
                </div>
                <div className="admin-order-status">
                  <div className="admin-order-total">{formatVnd(order.totals?.total)}</div>
                  <span className={`admin-status-pill ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>
              </div>
              <div className="admin-order-detail">
                <b>{order.customer?.name}</b> · {order.customer?.phone}<br />
                {order.customer?.address}
                {order.shipper ? (
                  <>
                    <br />Shipper: <b>{order.shipper.name || ''}</b>{order.shipper.phone ? ` (${order.shipper.phone})` : ''}
                  </>
                ) : null}
              </div>
              <div className="admin-order-items">{orderItemsText(order)}</div>
              <div className="admin-actions">
                {order.status === 'pending_confirmation' ? (
                  <>
                    <button className="btn-confirm" onClick={() => confirmOrder(order.id)} type="button">✅ Đã nhận tiền · Bắt đầu giao</button>
                    <button className="btn-del" onClick={() => deleteOrder(order.id)} type="button">🗑 Xoá đơn</button>
                  </>
                ) : null}
                {order.status === 'shipping' ? (
                  <button className="btn-deliver" onClick={() => markDelivered(order.id)} type="button">✅ Đánh dấu đã giao</button>
                ) : null}
                {order.status === 'delivered' ? (
                  <button className="btn-force-return" onClick={() => forceReturn(order.id)} type="button">↩ Đánh dấu đã trả hàng (xử lý ngoài app)</button>
                ) : null}
                {order.status === 'return_requested' ? (
                  <button className="btn-return-ok" onClick={() => shopConfirmReturn(order.id)} type="button">📦 Xác nhận, đang xử lý lấy đồ</button>
                ) : null}
                {order.status === 'return_processing' ? (
                  <button className="btn-return-done" onClick={() => markReturned(order.id)} type="button">✅ Đã nhận lại đồ · Hoàn tất</button>
                ) : null}
                {order.status === 'returned' ? <span className="admin-complete">✅ Đơn đã hoàn tất</span> : null}
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
