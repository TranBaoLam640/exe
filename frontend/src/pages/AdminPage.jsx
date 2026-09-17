import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { fetchAdminOrder, fetchAdminOrders, fetchAdminSession } from '../features/admin/adminService.js';
import { clearSession } from '../features/auth/authService.js';
import { formatVnd } from '../features/cart/cartService.js';
import { formatOrderDate, STATUS_LABELS } from '../features/orders/orderCreation.js';
import { updateBackendOrderStatus } from '../features/orders/orderApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const STATUSES = ['pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned', 'cancelled'];
const NEXT_STATUSES = {
  pending_confirmation: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: ['return_requested'],
  return_requested: ['return_processing'],
  return_processing: ['returned'],
  returned: [],
  cancelled: [],
};

function statusLabel(status) { return STATUS_LABELS[status] || status; }

function OrderDetail({ order, onClose, onUpdated }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const nextStatuses = NEXT_STATUSES[order.status] || [];

  async function saveStatus(event) {
    event.preventDefault();
    if (status === order.status) return;
    setSaving(true);
    setError('');
    try {
      await onUpdated(await updateBackendOrderStatus(order.id, status, note));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to update order status.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="admin-order-detail-title" className="admin-modal" role="dialog">
        <div className="admin-modal-head"><div><span className="admin-kicker">Order detail</span><h2 id="admin-order-detail-title">{order.code || order.id}</h2></div><button aria-label="Close order detail" className="admin-icon-button" onClick={onClose} type="button">x</button></div>
        <div className="admin-detail-grid">
          <div><span>Customer</span><strong>{order.customer?.name || '-'}</strong><small>{order.customer?.email || order.customer?.phone || '-'}</small></div>
          <div><span>Shop</span><strong>{order.shopName || '-'}</strong><small>{order.customer?.phone || '-'}</small></div>
          <div><span>Rental period</span><strong>{order.startDate || '-'} - {order.endDate || '-'}</strong><small>Created {formatOrderDate(order.createdAt)}</small></div>
          <div><span>Totals</span><strong>{formatVnd(order.totals?.total)}</strong><small>Deposit {formatVnd(order.totals?.deposit)}</small></div>
        </div>
        <h3>Items</h3>
        <div className="admin-detail-items">{(order.items || []).map((item) => <div className="admin-detail-item" key={item.id}><img alt="" onError={(event) => event.currentTarget.removeAttribute('src')} src={imageUrl(item.image)} /><div><strong>{item.name}</strong><span>{item.size} / {item.color} · Qty {item.qty}</span><small>{item.rentalStartDate} - {item.rentalEndDate} · {item.rentalDays} days</small></div><b>{formatVnd(item.lineSubtotal)}</b></div>)}</div>
        <div className="admin-detail-status"><div><span>Current status</span><strong className={`admin-status-pill ${order.status}`}>{statusLabel(order.status)}</strong>{order.status === 'returned' ? <small className="admin-lifecycle-note">Return completed. Inventory items are awaiting cleaning.</small> : null}</div>{nextStatuses.length > 0 ? <form onSubmit={saveStatus}><label htmlFor="admin-next-status">Update status</label><div className="admin-status-form"><select id="admin-next-status" onChange={(event) => setStatus(event.target.value)} value={status}><option value={order.status}>{statusLabel(order.status)}</option>{nextStatuses.map((next) => <option key={next} value={next}>{statusLabel(next)}</option>)}</select><button className="admin-primary-button" disabled={saving || status === order.status} type="submit">{saving ? 'Saving...' : 'Save'}</button></div><textarea maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Optional note" value={note} />{error ? <div className="admin-error-message">{error}</div> : null}</form> : <span className="admin-muted">No further status transition is available.</span>}</div>
        <h3>Status history</h3>
        <div className="admin-history-list">{(order.history || []).map((entry, index) => <div key={`${entry.at}-${index}`}><strong>{statusLabel(entry.status)}</strong><span>{entry.note || 'Status changed'}</span><small>{formatOrderDate(entry.at)}</small></div>)}</div>
      </section>
    </div>
  );
}

export default function AdminPage() {
  useDocumentTitle('Admin Orders | DoRentMe');
  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadOrders(nextFilters = filters) {
    setLoading(true); setError('');
    try { setOrders(await fetchAdminOrders(nextFilters)); } catch (requestError) { if (requestError?.response?.status === 401) clearSession(); setError(getApiErrorMessage(requestError, 'Unable to load orders.')); } finally { setLoading(false); }
  }

  useEffect(() => { fetchAdminSession().catch((requestError) => { if (requestError?.response?.status === 401) clearSession(); }); loadOrders().catch(() => {}); }, []);

  async function openDetail(id) {
    setSelectedId(id); setDetailLoading(true); setSelectedOrder(null);
    try { setSelectedOrder(await fetchAdminOrder(id)); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Unable to load order detail.')); setSelectedId(null); } finally { setDetailLoading(false); }
  }

  async function refreshAfterUpdate(updated) { setSelectedOrder(updated); await loadOrders(); }

  function changeFilter(name, value) { const next = { ...filters, [name]: value }; setFilters(next); loadOrders(next).catch(() => {}); }

  return (
    <div className="admin-page">
      <header className="admin-header"><div className="admin-brand"><img alt="DoRentMe" src={imageUrl('Logo.png')} /><h1>DoRentMe Admin Orders</h1></div><div className="inventory-admin-links"><Link to="/admin/inventory">Inventory</Link><span>JWT Admin</span></div></header>
      <main className="admin-body admin-orders-page">
        <div className="admin-page-heading"><div><span className="admin-kicker">Operations</span><h2>Orders</h2><p>Manage orders persisted by checkout.</p></div><button className="admin-secondary-button" disabled={loading} onClick={() => loadOrders()} type="button">Refresh</button></div>
        <div className="admin-order-filters"><label>Search<input onChange={(event) => changeFilter('search', event.target.value)} placeholder="Code, customer or email" value={filters.search} /></label><label>Status<select onChange={(event) => changeFilter('status', event.target.value)} value={filters.status}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label></div>
        {error ? <div className="admin-error-message">{error}</div> : null}
        {loading ? <div className="admin-empty">Loading orders...</div> : orders.length === 0 ? <div className="admin-empty">No database orders match these filters.</div> : <div className="admin-orders-table-wrap"><table className="admin-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Shop</th><th>Items</th><th>Rental period</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderCode}</strong><small>{formatOrderDate(order.createdAt)}</small></td><td><strong>{order.customerName}</strong><small>{order.customerEmail || '-'}</small></td><td>{order.shopName || '-'}</td><td>{order.itemCount}</td><td>{order.startDate} - {order.endDate}</td><td>{formatVnd(order.total)}</td><td><span className={`admin-status-pill ${order.status}`}>{statusLabel(order.status)}</span></td><td><button className="admin-secondary-button" onClick={() => openDetail(order.id)} type="button">View</button></td></tr>)}</tbody></table></div>}
      </main>
      {selectedId ? (detailLoading ? <div className="admin-modal-backdrop"><section className="admin-modal admin-empty">Loading order detail...</section></div> : selectedOrder ? <OrderDetail onClose={() => { setSelectedId(null); setSelectedOrder(null); }} onUpdated={refreshAfterUpdate} order={selectedOrder} /> : null) : null}
    </div>
  );
}
