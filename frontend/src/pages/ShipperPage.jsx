import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { fetchShipperShipments, updateShipperShipmentStatus } from '../features/shipper/shipperService.js';
import { formatOrderDate } from '../features/orders/orderCreation.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const SHIPMENT_TRANSITIONS = {
  pending: ['created', 'shipping', 'cancelled'],
  created: ['assigned', 'picked_up', 'shipping', 'cancelled'],
  assigned: ['picked_up', 'shipping', 'cancelled'],
  picked_up: ['shipping', 'delivered'],
  shipping: ['delivered', 'failed'],
  failed: ['created', 'cancelled'],
};

const RETURN_TRANSITIONS = {
  pending: ['picked_up', 'cancelled'],
  picked_up: ['returning', 'cancelled'],
  returning: ['returned', 'failed'],
  failed: ['picked_up', 'cancelled'],
};

function transitionsFor(shipment) {
  return (shipment.direction === 'return' ? RETURN_TRANSITIONS : SHIPMENT_TRANSITIONS)[shipment.status] || [];
}

export default function ShipperPage() {
  useDocumentTitle('Đơn Vận Chuyển | DoRentMe');
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  async function loadShipments() {
    setLoading(true);
    setError('');
    try {
      setShipments(await fetchShipperShipments());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể tải danh sách đơn vận chuyển.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadShipments().catch(() => {}); }, []);

  function updateDraft(id, values) {
    setDrafts((current) => ({ ...current, [id]: { ...(current[id] || {}), ...values } }));
  }

  async function saveStatus(event, shipment) {
    event.preventDefault();
    const draft = drafts[shipment.id] || {};
    const status = draft.status || shipment.status;
    if (status === shipment.status) return;
    setSavingId(shipment.id);
    setError('');
    try {
      const updated = await updateShipperShipmentStatus(shipment.id, status, draft.note || '');
      setShipments((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      updateDraft(shipment.id, { status: updated.status, note: '' });
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể cập nhật trạng thái vận chuyển.'));
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <Link to="/" title="Về trang chủ DoRentMe">
            <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          </Link>
          <h1>Giao Vận DoRentMe</h1>
        </div>
        <div className="inventory-admin-links">
          <Link to="/admin">📦 Quản trị</Link>
          <Link to="/">🌐 Xem Website</Link>
          <button className="admin-secondary-button" disabled={loading} onClick={() => loadShipments()} type="button">Làm mới</button>
        </div>
      </header>
      <main className="admin-body admin-orders-page">
        <div className="admin-page-heading"><div><span className="admin-kicker">Vận chuyển</span><h2>Đơn hàng được phân công</h2><p>Cập nhật trạng thái cho các đơn hàng được giao cho bạn.</p></div></div>
        {error ? <div className="admin-error-message">{error}</div> : null}
        {loading ? <div className="admin-empty">Đang tải danh sách vận chuyển...</div> : shipments.length === 0 ? <div className="admin-empty">Chưa có đơn vận chuyển nào được phân công.</div> : <div className="admin-shipment-list">{shipments.map((shipment) => {
          const allowed = transitionsFor(shipment);
          const draft = drafts[shipment.id] || {};
          const selectedStatus = draft.status || shipment.status;
          return (
            <section className="admin-detail-status" key={shipment.id}>
              <div className="admin-detail-grid">
                <div><span>Đơn hàng</span><strong>{shipment.orderCode || shipment.orderId}</strong><small>{shipment.direction === 'return' ? 'Đơn trả hàng' : 'Đơn giao hàng'}</small></div>
                <div><span>Trạng thái</span><strong>{shipment.status}</strong><small>{shipment.provider}</small></div>
                <div><span>Vận đơn</span><strong>{shipment.trackingCode || '-'}</strong><small>{shipment.receiverName} · {shipment.receiverPhone}</small></div>
                <div><span>Địa chỉ</span><strong>{shipment.receiverAddress}</strong></div>
              </div>
              {allowed.length ? <form onSubmit={(event) => saveStatus(event, shipment)}><label htmlFor={`shipper-status-${shipment.id}`}>Cập nhật trạng thái</label><div className="admin-status-form"><select id={`shipper-status-${shipment.id}`} onChange={(event) => updateDraft(shipment.id, { status: event.target.value })} value={selectedStatus}><option value={shipment.status}>{shipment.status}</option>{allowed.map((status) => <option key={status} value={status}>{status}</option>)}</select><button className="admin-primary-button" disabled={savingId === shipment.id || selectedStatus === shipment.status} type="submit">{savingId === shipment.id ? 'Đang lưu...' : 'Lưu trạng thái'}</button></div><textarea maxLength={500} onChange={(event) => updateDraft(shipment.id, { note: event.target.value })} placeholder="Ghi chú giao hàng (tuỳ chọn)" value={draft.note || ''} /></form> : <div className="admin-muted">Không còn bước chuyển trạng thái nào khả dụng.</div>}
              {shipment.trackingEvents?.length ? <div className="admin-history-list">{shipment.trackingEvents.map((event) => <div key={event.id}><strong>{event.status}</strong><span>{event.message || 'Cập nhật vận chuyển'}</span><small>{formatOrderDate(event.createdAt)}</small></div>)}</div> : null}
            </section>
          );
        })}</div>}
      </main>
    </div>
  );
}
