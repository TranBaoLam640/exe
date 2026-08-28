import { Link, useParams } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { formatVnd, parsePrice } from '../features/cart/cartService.js';
import {
  confirmDelivery,
  formatOrderDate,
  getOrderById,
  requestReturn,
  STATUS_LABELS,
} from '../features/orders/orderCreation.js';
import { useOrders } from '../features/orders/useOrders.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const steps = [
  { key: 0, icon: '⏳', label: 'Chờ xác nhận' },
  { key: 1, icon: '🚚', label: 'Đang giao' },
  { key: 2, icon: '✅', label: 'Đã giao hàng' },
  { key: 3, icon: '↩', label: 'Trả hàng / Hoàn tất' },
];

function stepIndex(status) {
  return {
    pending_confirmation: 0,
    shipping: 1,
    delivered: 2,
    return_requested: 2,
    return_processing: 2,
    returned: 3,
  }[status] ?? 0;
}

function StatusBanner({ order }) {
  if (order.status === 'pending_confirmation') {
    return <div className="tracking-status-banner warn">⏳ Đơn đang chờ shop xác nhận giao dịch chuyển khoản. Thường mất 15-30 phút trong giờ hành chính.</div>;
  }
  if (order.status === 'shipping') {
    const shipper = order.shipper;
    return (
      <div className="tracking-status-banner info">
        🚚 Đơn đang được giao{shipper ? <> bởi <b>{shipper.name}</b>{shipper.phone ? ` (${shipper.phone})` : ''}</> : null}.
      </div>
    );
  }
  if (order.status === 'delivered') {
    return <div className="tracking-status-banner success">✅ Đơn đã được giao. Vui lòng kiểm tra sản phẩm.</div>;
  }
  if (order.status === 'return_requested') {
    return <div className="tracking-status-banner warn">↩ Bạn đã gửi yêu cầu trả hàng lúc {formatOrderDate(order.returnRequestedAt)}. Đang chờ shop xác nhận.</div>;
  }
  if (order.status === 'return_processing') {
    return <div className="tracking-status-banner info">📦 Shop đang sắp xếp đến lấy đồ trả.</div>;
  }
  if (order.status === 'returned') {
    return <div className="tracking-status-banner success">🎉 Đơn hàng đã hoàn tất! Cảm ơn bạn đã thuê đồ tại DoRentMe.</div>;
  }
  return null;
}

function TrackingActions({ order }) {
  if (order.status === 'delivered') {
    return (
      <div className="tracking-action-row">
        {order.deliveryConfirmed ? (
          <button className="btn-done" disabled type="button">✅ Đã xác nhận nhận hàng</button>
        ) : (
          <button className="btn-done" onClick={() => confirmDelivery(order.id)} type="button">✅ Hoàn thành đơn</button>
        )}
        <button
          className="btn-return"
          onClick={() => {
            if (window.confirm('Xác nhận gửi yêu cầu trả hàng cho shop?')) requestReturn(order.id);
          }}
          type="button"
        >
          ↩ Yêu cầu trả hàng
        </button>
      </div>
    );
  }

  if (order.status === 'return_requested' || order.status === 'return_processing') {
    return (
      <div className="tracking-action-row">
        <button className="btn-return" disabled type="button">↩ Đã gửi yêu cầu trả hàng</button>
      </div>
    );
  }

  return null;
}

export default function OrderTrackingPage() {
  const { orderId } = useParams();
  useOrders();
  const order = orderId ? getOrderById(decodeURIComponent(orderId)) : null;
  useDocumentTitle(order ? `Theo Dõi Đơn ${order.id} | DoRentMe` : 'Theo Dõi Đơn Hàng | DoRentMe');

  if (!order) {
    return (
      <div className="order-tracking-page">
        <div className="tracking-head">
          <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/orders">Đơn hàng</Link> › <span>Theo dõi</span></div>
          <h1>📦 Theo dõi đơn hàng</h1>
        </div>
        <div className="tracking-card not-found">
          <div className="not-found-icon">🔎</div>
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Mã đơn không tồn tại hoặc đã bị xoá khỏi trình duyệt này.</p>
          <Link to="/orders">Xem tất cả đơn hàng →</Link>
        </div>
      </div>
    );
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const idx = stepIndex(order.status);
  const fillPct = [8, 36, 64, 92][idx];

  return (
    <div className="order-tracking-page">
      <div className="tracking-head">
        <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <Link to="/orders">Đơn hàng</Link> › <span>Theo dõi</span></div>
        <h1>📦 Theo dõi đơn hàng</h1>
      </div>

      <section className="tracking-card">
        <div className="tracking-order-code">Mã đơn: {order.id} · Đặt lúc {formatOrderDate(order.createdAt)}</div>
      </section>

      <section className="tracking-card">
        <h3>Trạng thái đơn hàng</h3>
        <div className="tracking-stepper">
          <div className="tracking-fill-line" style={{ width: `${fillPct}%` }} />
          {steps.map((step) => (
            <div className={`tracking-step ${step.key < idx ? 'done' : step.key === idx ? 'active done' : ''}`} key={step.key}>
              <div className="tracking-step-dot">{step.icon}</div>
              <div className="tracking-step-label">{step.label}</div>
            </div>
          ))}
        </div>
        <div className="tracking-banner-wrap"><StatusBanner order={order} /></div>
        <TrackingActions order={order} />
      </section>

      <section className="tracking-card">
        <h3>Thông tin nhận đồ</h3>
        <div className="tracking-info-line">Người nhận: <b>{order.customer?.name}</b></div>
        <div className="tracking-info-line">SĐT: <b>{order.customer?.phone}</b></div>
        <div className="tracking-info-line">Địa chỉ: <b>{order.customer?.address}</b></div>
        {order.customer?.note ? <div className="tracking-info-line">Ghi chú: {order.customer.note}</div> : null}
      </section>

      <section className="tracking-card">
        <h3>Sản phẩm ({items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0)})</h3>
        {items.map((item, index) => {
          const qty = Number(item.qty) || 1;
          return (
            <div className="tracking-item" key={`${item.name}-${index}`}>
              <img
                alt={item.name}
                onError={(event) => {
                  event.currentTarget.removeAttribute('src');
                }}
                src={imageUrl(item.image)}
              />
              <div className="tracking-item-info">
                <div className="tracking-item-name">{item.name}</div>
                <div className="tracking-item-sub">SL: {qty} × {item.price3day}</div>
              </div>
              <div className="tracking-item-price">{formatVnd(parsePrice(item.price3day) * qty)}</div>
            </div>
          );
        })}
        <div className="tracking-totals">
          <div className="tracking-info-line">Tiền thuê: <b>{formatVnd(order.totals?.rent)}</b></div>
          <div className="tracking-info-line">Tiền cọc: <b>{formatVnd(order.totals?.deposit)}</b></div>
          <div className="tracking-info-line total">Tổng đã thanh toán: <b>{formatVnd(order.totals?.total)}</b></div>
        </div>
      </section>

      <section className="tracking-card">
        <h3>Lịch sử</h3>
        {(Array.isArray(order.history) ? order.history : []).map((entry, index) => (
          <div className="history-line" key={`${entry.at}-${index}`}>
            <b>{STATUS_LABELS[entry.status] || entry.status}</b>
            <span>{entry.note}</span>
            <small>{formatOrderDate(entry.at)}</small>
          </div>
        ))}
      </section>

      <Link className="tracking-back-link" to="/orders">← Xem tất cả đơn hàng của tôi</Link>
    </div>
  );
}
