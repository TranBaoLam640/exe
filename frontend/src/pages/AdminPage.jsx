import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { fetchAdminSession } from '../features/admin/adminService.js';
import { clearSession } from '../features/auth/authService.js';
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

function orderItemsText(order) {
  return Array.isArray(order.items)
    ? order.items.map((item) => `${item.name} x ${Number(item.qty) || 1}`).join(', ')
    : '';
}

export default function AdminPage() {
  useDocumentTitle('Admin Orders | DoRentMe');
  const navigate = useNavigate();
  const orders = useOrders();
  const [accessState, setAccessState] = useState('checking');

  useEffect(() => {
    let cancelled = false;

    fetchAdminSession()
      .then(() => {
        if (!cancelled) setAccessState('allowed');
      })
      .catch((error) => {
        if (cancelled) return;

        if (error?.response?.status === 401) {
          clearSession();
          navigate('/login?redirect=%2Fadmin', { replace: true });
          return;
        }

        setAccessState('denied');
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  function confirmOrder(id) {
    const name = window.prompt('Shipper name (optional):', '') || '';
    const phone = name ? window.prompt('Shipper phone (optional):', '') || '' : '';
    shopConfirm(id, name ? { name, phone } : null);
  }

  function forceReturn(id) {
    if (window.confirm('Mark this order as returned?')) {
      markReturned(id);
    }
  }

  function deleteOrder(id) {
    if (window.confirm('Delete this order? This cannot be undone.')) {
      removeOrder(id);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          <h1>DoRentMe Admin Orders</h1>
        </div>
        <span>JWT Admin</span>
      </header>

      <div className="admin-warn-banner">
        This order screen still displays prototype browser-local orders. Access is now protected by the real backend JWT ADMIN role.
      </div>

      <main className="admin-body">
        {accessState === 'checking' ? (
          <div className="admin-empty">Checking admin access...</div>
        ) : accessState === 'denied' ? (
          <div className="admin-empty">Your authenticated account does not have permission to access this page.</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty">No orders are stored in this browser.</div>
        ) : (
          orders.map((order) => (
            <article className="admin-order-row" key={order.id}>
              <div className="admin-order-top">
                <div>
                  <div className="admin-order-id">Code: {order.id}</div>
                  <div className="admin-order-date">{formatOrderDate(order.createdAt)}</div>
                </div>
                <div className="admin-order-status">
                  <div className="admin-order-total">{formatVnd(order.totals?.total)}</div>
                  <span className={`admin-status-pill ${order.status}`}>{STATUS_LABELS[order.status] || order.status}</span>
                </div>
              </div>
              <div className="admin-order-detail">
                <b>{order.customer?.name}</b> - {order.customer?.phone}<br />
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
                    <button className="btn-confirm" onClick={() => confirmOrder(order.id)} type="button">Confirm and start shipping</button>
                    <button className="btn-del" onClick={() => deleteOrder(order.id)} type="button">Delete order</button>
                  </>
                ) : null}
                {order.status === 'shipping' ? (
                  <button className="btn-deliver" onClick={() => markDelivered(order.id)} type="button">Mark delivered</button>
                ) : null}
                {order.status === 'delivered' ? (
                  <button className="btn-force-return" onClick={() => forceReturn(order.id)} type="button">Mark returned manually</button>
                ) : null}
                {order.status === 'return_requested' ? (
                  <button className="btn-return-ok" onClick={() => shopConfirmReturn(order.id)} type="button">Confirm return processing</button>
                ) : null}
                {order.status === 'return_processing' ? (
                  <button className="btn-return-done" onClick={() => markReturned(order.id)} type="button">Complete return</button>
                ) : null}
                {order.status === 'returned' ? <span className="admin-complete">Order completed</span> : null}
              </div>
            </article>
          ))
        )}
      </main>
    </div>
  );
}
