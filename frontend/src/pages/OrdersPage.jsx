import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { getSession } from '../features/auth/authService.js';
import { formatVnd } from '../features/cart/cartService.js';
import { filterOrdersForSession, formatOrderDate, STATUS_LABELS } from '../features/orders/orderCreation.js';
import { useOrders } from '../features/orders/useOrders.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

function orderQuantity(order) {
  return Array.isArray(order.items) ? order.items.reduce((sum, item) => sum + (Number(item?.qty) || 1), 0) : 0;
}

export default function OrdersPage() {
  useDocumentTitle('Đơn Hàng Của Tôi | DoRentMe');
  const session = getSession();
  const orders = filterOrdersForSession(useOrders(), session);

  return (
    <div className="orders-page">
      <div className="orders-head">
        <div className="stateful-breadcrumb"><Link to="/">Trang chủ</Link> › <span>Đơn hàng của tôi</span></div>
        <h1>📦 Đơn hàng của tôi</h1>
        <p>
          {session
            ? `Xin chào ${session.name}, đây là các đơn hàng của bạn.`
            : 'Bạn đang xem với tư cách khách. Đăng nhập để lưu & xem đầy đủ lịch sử đơn hàng.'}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="empty-orders">
          <div className="empty-orders-icon">📦</div>
          <h2>Bạn chưa có đơn hàng nào</h2>
          <p>Đặt thuê trang phục đầu tiên của bạn ngay hôm nay!</p>
          <Link to="/shop">Khám phá Shop →</Link>
        </div>
      ) : (
        orders.map((order) => {
          const items = Array.isArray(order.items) ? order.items : [];
          const firstName = items[0]?.name || '';
          const extra = items.length > 1 ? ` +${items.length - 1} sản phẩm khác` : '';

          return (
            <Link className="customer-order-card" key={order.id} to={`/orders/${encodeURIComponent(order.id)}`}>
              <div className="order-thumbs">
                {items.slice(0, 3).map((item, index) => (
                  <img
                    alt=""
                    key={`${order.id}-${item.name}-${index}`}
                    onError={(event) => {
                      event.currentTarget.removeAttribute('src');
                    }}
                    src={imageUrl(item.image)}
                  />
                ))}
              </div>
              <div className="order-main">
                <div className="order-id">Mã đơn: {order.id} · {orderQuantity(order)} sản phẩm</div>
                <div className="order-name">{firstName}{extra}</div>
                <div className="order-date">{formatOrderDate(order.createdAt)}</div>
              </div>
              <div className="order-right">
                <div className="order-total">{formatVnd(order.totals?.total)}</div>
                <span className={`status-badge ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
