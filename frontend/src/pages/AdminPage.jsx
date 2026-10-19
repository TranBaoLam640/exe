import DepositSettlementForm from '../components/DepositSettlementForm.jsx';
import AdminRefundEvidence from '../components/AdminRefundEvidence.jsx';
import DepositReturnProgress from '../components/DepositReturnProgress.jsx';
import EvidenceGallery from '../components/EvidenceGallery.jsx';
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { createAdminReturnShipment, createAdminShipment, createDepositSettlement, createInspection, fetchAdminOrder, fetchAdminOrders, fetchAdminPayment, fetchAdminPaymentTransactions, fetchAdminRefunds, fetchAdminSession, fetchAdminShipments, fetchAdminShippers, fetchInspectionAssets, fetchInspectionSummary, updateAdminPaymentStatus, updateAdminRefundStatus, updateAdminShipment, updateInspection } from '../features/admin/adminService.js';
import { clearSession } from '../features/auth/authService.js';
import { formatVnd } from '../features/cart/cartService.js';
import { formatOrderDate, STATUS_LABELS } from '../features/orders/orderCreation.js';
import { updateBackendOrderStatus } from '../features/orders/orderApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';
import AdminTrafficDashboard from '../features/admin/components/AdminTrafficDashboard.jsx';

const STATUSES = ['pending_confirmation', 'shipping', 'delivered', 'return_requested', 'return_processing', 'returned', 'cancelled'];
const NEXT_STATUSES = {
  pending_confirmation: ['shipping', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  return_requested: [],
  return_processing: [],
  returned: [],
  cancelled: [],
};

function statusLabel(status) { return STATUS_LABELS[status] || status; }

function OrderDetail({ order, payment, transactions, shipment, returnShipment, refunds, inspectionAssets, inspectionSummary, shippers, onClose, onUpdated, onPaymentUpdated, onShipmentUpdated, onReturnShipmentUpdated, onRefundsUpdated, onInspectionUpdated }) {
  const [status, setStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [paymentStatus, setPaymentStatus] = useState(payment?.status || 'pending');
  const [transactionCode, setTransactionCode] = useState(payment?.transactionCode || '');
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [shipmentSaving, setShipmentSaving] = useState(false);
  const [shipmentError, setShipmentError] = useState('');
  const [returnShipmentProvider, setReturnShipmentProvider] = useState('manual');
  const [returnShipmentTrackingCode, setReturnShipmentTrackingCode] = useState('');
  const [returnShipmentSaving, setReturnShipmentSaving] = useState(false);
  const [returnShipmentError, setReturnShipmentError] = useState('');
  const [shipmentProvider, setShipmentProvider] = useState('manual');
  const [shipmentTrackingCode, setShipmentTrackingCode] = useState('');
  const [shipmentShipperId, setShipmentShipperId] = useState(shipment?.assignedShipperUserId ? String(shipment.assignedShipperUserId) : '');
  const [returnShipmentShipperId, setReturnShipmentShipperId] = useState(returnShipment?.assignedShipperUserId ? String(returnShipment.assignedShipperUserId) : '');
  const [refundAmount, setRefundAmount] = useState(String(payment?.depositAmount || order.totals?.deposit || 0));
  const [refundReason, setRefundReason] = useState('');
  const [refundSaving, setRefundSaving] = useState(false);
  const [refundError, setRefundError] = useState('');
  const [inspectionAsset, setInspectionAsset] = useState(null);
  const [inspectionCondition, setInspectionCondition] = useState('GOOD');
  const [inspectionDamage, setInspectionDamage] = useState(false);
  const [inspectionDescription, setInspectionDescription] = useState('');
  const [inspectionDeduction, setInspectionDeduction] = useState('0');
  const [inspectionSaving, setInspectionSaving] = useState(false);
  const [inspectionError, setInspectionError] = useState('');
  const nextStatuses = NEXT_STATUSES[order.status] || [];
  const paymentTransitions = payment?.status === 'pending' && payment?.method !== 'payos' ? ['paid', 'failed', 'cancelled'] : [];

  useEffect(() => { setShipmentShipperId(shipment?.assignedShipperUserId ? String(shipment.assignedShipperUserId) : ''); }, [shipment?.id, shipment?.assignedShipperUserId]);
  useEffect(() => { setReturnShipmentShipperId(returnShipment?.assignedShipperUserId ? String(returnShipment.assignedShipperUserId) : ''); }, [returnShipment?.id, returnShipment?.assignedShipperUserId]);

  async function createShipment(event) {
    event.preventDefault(); setShipmentSaving(true); setShipmentError('');
    const assignedShipperUserId = Number(shipmentShipperId);
    if (!assignedShipperUserId) { setShipmentError('Please choose a shipper before creating shipment.'); setShipmentSaving(false); return; }
    try { onShipmentUpdated(await createAdminShipment(order.id, { provider: shipmentProvider, trackingCode: shipmentTrackingCode, assignedShipperUserId })); } catch (requestError) { setShipmentError(getApiErrorMessage(requestError, 'Unable to create shipment.')); } finally { setShipmentSaving(false); }
  }

  async function saveShipmentAssignment(event) {
    event.preventDefault(); if (!shipment) return;
    const assignedShipperUserId = Number(shipmentShipperId);
    if (!assignedShipperUserId) { setShipmentError('Please choose a shipper.'); return; }
    if (assignedShipperUserId === shipment.assignedShipperUserId) return;
    setShipmentSaving(true); setShipmentError('');
    try { onShipmentUpdated(await updateAdminShipment(shipment.id, { provider: shipment.provider, trackingCode: shipment.trackingCode, serviceType: shipment.serviceType, assignedShipperUserId })); } catch (requestError) { setShipmentError(getApiErrorMessage(requestError, 'Unable to assign shipment.')); } finally { setShipmentSaving(false); }
  }

  async function createReturnShipment(event) {
    event.preventDefault(); setReturnShipmentSaving(true); setReturnShipmentError('');
    const assignedShipperUserId = Number(returnShipmentShipperId);
    if (!assignedShipperUserId) { setReturnShipmentError('Please choose a shipper before creating return shipment.'); setReturnShipmentSaving(false); return; }
    try { onReturnShipmentUpdated(await createAdminReturnShipment(order.id, { provider: returnShipmentProvider, trackingCode: returnShipmentTrackingCode, assignedShipperUserId })); } catch (requestError) { setReturnShipmentError(getApiErrorMessage(requestError, 'Unable to create return shipment.')); } finally { setReturnShipmentSaving(false); }
  }

  async function saveReturnShipmentAssignment(event) {
    event.preventDefault(); if (!returnShipment) return;
    const assignedShipperUserId = Number(returnShipmentShipperId);
    if (!assignedShipperUserId) { setReturnShipmentError('Please choose a shipper.'); return; }
    if (assignedShipperUserId === returnShipment.assignedShipperUserId) return;
    setReturnShipmentSaving(true); setReturnShipmentError('');
    try { onReturnShipmentUpdated(await updateAdminShipment(returnShipment.id, { provider: returnShipment.provider, trackingCode: returnShipment.trackingCode, serviceType: returnShipment.serviceType, assignedShipperUserId })); } catch (requestError) { setReturnShipmentError(getApiErrorMessage(requestError, 'Unable to assign return shipment.')); } finally { setReturnShipmentSaving(false); }
  }

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

  async function savePaymentStatus(event) {
    event.preventDefault();
    if (!payment || paymentStatus === payment.status) return;
    if (paymentStatus === 'paid' && !window.confirm('Xac nhan da nhan duoc chuyen khoan cho don hang nay?')) return;
    setPaymentSaving(true);
    setPaymentError('');
    try {
      const updated = await updateAdminPaymentStatus(payment.id, paymentStatus, transactionCode);
      onPaymentUpdated(updated);
    } catch (requestError) {
      setPaymentError(getApiErrorMessage(requestError, 'Unable to update payment status.'));
    } finally {
      setPaymentSaving(false);
    }
  }

  async function settleDeposit(event) {
    event.preventDefault();
    const amount = Number(refundAmount);
    if (!Number.isFinite(amount) || amount < 0 || amount > Number(payment.depositAmount)) {
      setRefundError('Refund amount must be between zero and the stored deposit.');
      return;
    }
    if (amount < Number(payment.depositAmount) && !refundReason.trim()) {
      setRefundError('A reason is required when part of the deposit is retained.');
      return;
    }
    setRefundSaving(true); setRefundError('');
    try {
      const created = await createDepositSettlement(order.id, amount, refundReason);
      onRefundsUpdated([created, ...refunds]);
      setRefundReason('');
    } catch (requestError) {
      setRefundError(getApiErrorMessage(requestError, 'Unable to create deposit settlement.'));
    } finally { setRefundSaving(false); }
  }

  async function processRefund(refund, nextStatus) {
    if (refundSaving) return;
    if (nextStatus === 'completed' && !window.confirm('Xac nhan refund nay da duoc chuyen khoan thu cong ben ngoai he thong?')) return;
    setRefundSaving(true); setRefundError('');
    try {
      const transactionCode = nextStatus === 'completed'
        ? window.prompt('Transaction code (optional)', refund.transactionCode || '')
        : refund.transactionCode;
      const updated = await updateAdminRefundStatus(refund.id, nextStatus, transactionCode);
      onRefundsUpdated(refunds.map((item) => item.id === updated.id ? updated : item));
    } catch (requestError) {
      setRefundError(getApiErrorMessage(requestError, 'Unable to update refund status.'));
    } finally { setRefundSaving(false); }
  }

  function openInspection(asset) {
    const inspection = asset.inspection;
    setInspectionAsset(asset);
    setInspectionCondition(inspection?.conditionAfterReturn || 'GOOD');
    setInspectionDamage(inspection?.hasDamage || false);
    setInspectionDescription(inspection?.damageDescription || '');
    setInspectionDeduction(String(inspection?.recommendedDeduction || 0));
    setInspectionError('');
  }

  async function saveInspection(event) {
    event.preventDefault();
    if (!inspectionAsset) return;
    const hasDamage = inspectionDamage;
    const description = hasDamage ? inspectionDescription.trim() : null;
    const deduction = hasDamage ? Number(inspectionDeduction) : 0;
    if (hasDamage && !description) { setInspectionError('Damage description is required.'); return; }
    if (!Number.isFinite(deduction) || deduction < 0 || deduction > Number(inspectionAsset.depositAllocation)) { setInspectionError('Deduction exceeds this asset deposit allocation.'); return; }
    setInspectionSaving(true); setInspectionError('');
    try {
      const payload = { productInventoryItemId: inspectionAsset.productInventoryItemId, conditionAfterReturn: inspectionCondition, hasDamage, damageDescription: description, recommendedDeduction: deduction };
      const saved = inspectionAsset.inspection ? await updateInspection(inspectionAsset.inspection.id, payload) : await createInspection(order.id, payload);
      onInspectionUpdated(saved);
      setInspectionAsset(null);
    } catch (requestError) { setInspectionError(getApiErrorMessage(requestError, 'Unable to save inspection.')); } finally { setInspectionSaving(false); }
  }

  return (
    <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section aria-labelledby="admin-order-detail-title" className="admin-modal" role="dialog">
        <div className="admin-modal-head"><div><span className="admin-kicker">Chi tiết đơn hàng</span><h2 id="admin-order-detail-title">{order.code || order.id}</h2></div><button aria-label="Đóng chi tiết đơn hàng" className="admin-icon-button" onClick={onClose} type="button">x</button></div>
        <div className="admin-detail-grid">
          <div><span>Khách hàng</span><strong>{order.customer?.name || '-'}</strong><small>{order.customer?.email || order.customer?.phone || '-'}</small></div>
          <div><span>Cửa hàng</span><strong>{order.shopName || '-'}</strong><small>{order.customer?.phone || '-'}</small></div>
          <div><span>Thời gian thuê</span><strong>{order.startDate || '-'} - {order.endDate || '-'}</strong><small>Ngày tạo {formatOrderDate(order.createdAt)}</small></div>
          <div><span>Tổng cộng</span><strong>{formatVnd(order.totals?.total)}</strong><small>Tiền cọc {formatVnd(order.totals?.deposit)}</small></div>
        </div>
        <section className="admin-customer-return-evidence">
          <div className="admin-refund-evidence-heading"><h3>Ảnh khách gửi khi trả hàng</h3><span>{order.returnPhotoIds?.length || 0} ảnh</span></div>
          {order.returnPhotoIds?.length ? <><p>Kiểm tra tình trạng hàng qua ảnh của khách trước khi xử lý trả hàng. Nhấn vào ảnh để xem bản đầy đủ.</p><EvidenceGallery ids={order.returnPhotoIds} label="Ảnh khách gửi khi trả hàng" /></> : <p>Đơn hàng này chưa có ảnh trả hàng được gửi thành công.</p>}
        </section>
        {Number(order.totals?.deposit) > 0 && ['return_requested', 'return_processing', 'returned'].includes(order.status) ? <DepositReturnProgress order={order} refunds={refunds} admin /> : null}
        {payment ? <>
          <h3>Thanh toán</h3>
          <div className="admin-detail-grid">
            <div><span>Trạng thái</span><strong>{payment.status}</strong><small>{payment.method}</small></div>
            <div><span>Số tiền</span><strong>{formatVnd(payment.amount)}</strong><small>Thuê {formatVnd(payment.rentalAmount)} / Cọc {formatVnd(payment.depositAmount)} / Giảm {formatVnd(payment.discountAmount)}</small></div>
            <div><span>Chuyển khoản</span><strong>{payment.bankName || '-'}</strong><small>{payment.bankAccountNo || '-'} / {payment.bankAccountName || '-'}</small></div>
            <div><span>Nội dung chuyển</span><strong>{payment.transferContent || '-'}</strong><small>{payment.paidAt ? `Đã thanh toán ${formatOrderDate(payment.paidAt)}` : 'Chưa thanh toán'}</small></div>
          </div>
          {paymentTransitions.length > 0 ? <form className="admin-detail-status" onSubmit={savePaymentStatus}><label htmlFor="admin-payment-status">Cập nhật thanh toán</label><div className="admin-status-form"><select id="admin-payment-status" onChange={(event) => setPaymentStatus(event.target.value)} value={paymentStatus}><option value={payment.status}>{payment.status}</option>{paymentTransitions.map((next) => <option key={next} value={next}>{next}</option>)}</select><input maxLength={100} onChange={(event) => setTransactionCode(event.target.value)} placeholder="Mã giao dịch (tuỳ chọn)" value={transactionCode} /><button className="admin-primary-button" disabled={paymentSaving || paymentStatus === payment.status} type="submit">{paymentSaving ? 'Đang lưu...' : 'Lưu thanh toán'}</button></div>{paymentError ? <div className="admin-error-message">{paymentError}</div> : null}</form> : <div className="admin-muted">Trạng thái thanh toán đã hoàn tất. Hoàn tiền cọc và chứng từ chuyển khoản được quản lý bên dưới.</div>}
          {transactions.length > 0 ? <div className="admin-history-list"><strong>Giao dịch PayOS</strong>{transactions.map((transaction) => <div key={transaction.id}><span>#{transaction.id} {transaction.status} · {formatVnd(transaction.amount)}</span><small>{transaction.providerOrderCode} · {formatOrderDate(transaction.createdAt)}{transaction.paidAt ? ` · Đã thanh toán ${formatOrderDate(transaction.paidAt)}` : ''}</small></div>)}</div> : null}
        </> : <div className="admin-muted">Chưa có thông tin thanh toán cho đơn hàng này.</div>}
        <h3>Vận chuyển giao hàng</h3>
        {shipment ? <div className="admin-detail-status"><div className="admin-detail-grid"><div><span>Trạng thái</span><strong>{shipment.status}</strong><small>{shipment.provider}</small></div><div><span>Mã vận đơn</span><strong>{shipment.trackingCode || '-'}</strong><small>{shipment.receiverName} · {shipment.receiverPhone}</small></div><div><span>Địa chỉ nhận</span><strong>{shipment.receiverAddress}</strong></div><div><span>Shipper phụ trách</span><strong>{shipment.assignedShipperName || '-'}</strong><small>{shipment.assignedShipperPhone || shipment.assignedShipperEmail || 'Chưa phân công'}</small></div></div><form onSubmit={saveShipmentAssignment}><label htmlFor="admin-shipment-shipper">Phân công shipper giao hàng</label><div className="admin-status-form"><select id="admin-shipment-shipper" onChange={(event) => setShipmentShipperId(event.target.value)} value={shipmentShipperId}><option value="">Chọn shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={shipmentSaving || Number(shipmentShipperId) === shipment.assignedShipperUserId} type="submit">{shipmentSaving ? 'Đang lưu...' : 'Lưu phân công'}</button></div><small className="admin-muted">Trạng thái giao hàng do shipper được phân công cập nhật.</small>{shipmentError ? <div className="admin-error-message">{shipmentError}</div> : null}</form>{shipment.trackingEvents?.length ? <div className="admin-history-list">{shipment.trackingEvents.map((event) => <div key={event.id}><strong>{event.status}</strong><span>{event.message || 'Cập nhật giao hàng'}</span><small>{formatOrderDate(event.createdAt)}</small></div>)}</div> : null}</div> : order.status === 'pending_confirmation' ? <form className="admin-detail-status" onSubmit={createShipment}><div className="admin-status-form"><input maxLength={50} onChange={(event) => setShipmentProvider(event.target.value)} placeholder="Đơn vị vận chuyển (thủ công)" value={shipmentProvider} /><input maxLength={100} onChange={(event) => setShipmentTrackingCode(event.target.value)} placeholder="Mã vận đơn (tuỳ chọn)" value={shipmentTrackingCode} /><select onChange={(event) => setShipmentShipperId(event.target.value)} value={shipmentShipperId}><option value="">Chọn shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={shipmentSaving} type="submit">{shipmentSaving ? 'Đang tạo...' : 'Tạo vận đơn giao hàng'}</button></div>{shipmentError ? <div className="admin-error-message">{shipmentError}</div> : null}</form> : <div className="admin-muted">Có thể tạo vận đơn trước khi xuất kho.</div>}
        <h3>Thu hồi trả hàng</h3>
        {returnShipment ? <div className="admin-detail-status"><div className="admin-detail-grid"><div><span>Trạng thái</span><strong>{returnShipment.status}</strong><small>{returnShipment.provider}</small></div><div><span>Mã vận đơn</span><strong>{returnShipment.trackingCode || '-'}</strong><small>{returnShipment.senderName} · {returnShipment.senderPhone}</small></div><div><span>Địa chỉ trả hàng</span><strong>{returnShipment.receiverAddress}</strong></div><div><span>Shipper phụ trách</span><strong>{returnShipment.assignedShipperName || '-'}</strong><small>{returnShipment.assignedShipperPhone || returnShipment.assignedShipperEmail || 'Chưa phân công'}</small></div></div><form onSubmit={saveReturnShipmentAssignment}><label htmlFor="admin-return-shipment-shipper">Phân công shipper thu hồi hàng</label><div className="admin-status-form"><select id="admin-return-shipment-shipper" onChange={(event) => setReturnShipmentShipperId(event.target.value)} value={returnShipmentShipperId}><option value="">Chọn shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={returnShipmentSaving || Number(returnShipmentShipperId) === returnShipment.assignedShipperUserId} type="submit">{returnShipmentSaving ? 'Đang lưu...' : 'Lưu phân công'}</button></div><small className="admin-muted">Trạng thái trả hàng do shipper được phân công cập nhật.</small>{returnShipmentError ? <div className="admin-error-message">{returnShipmentError}</div> : null}</form>{returnShipment.trackingEvents?.length ? <div className="admin-history-list">{returnShipment.trackingEvents.map((event) => <div key={event.id}><strong>{event.status}</strong><span>{event.message || 'Cập nhật trả hàng'}</span><small>{formatOrderDate(event.createdAt)}</small></div>)}</div> : null}</div> : order.status === 'return_requested' ? <form className="admin-detail-status" onSubmit={createReturnShipment}><div className="admin-status-form"><input maxLength={50} onChange={(event) => setReturnShipmentProvider(event.target.value)} placeholder="Đơn vị vận chuyển (thủ công)" value={returnShipmentProvider} /><input maxLength={100} onChange={(event) => setReturnShipmentTrackingCode(event.target.value)} placeholder="Mã vận đơn (tuỳ chọn)" value={returnShipmentTrackingCode} /><select onChange={(event) => setReturnShipmentShipperId(event.target.value)} value={returnShipmentShipperId}><option value="">Chọn shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={returnShipmentSaving} type="submit">{returnShipmentSaving ? 'Đang tạo...' : 'Tạo vận đơn trả hàng'}</button></div>{returnShipmentError ? <div className="admin-error-message">{returnShipmentError}</div> : null}</form> : <div className="admin-muted">Vận đơn trả hàng khả dụng sau khi khách hàng yêu cầu trả hàng.</div>}
        {order.status === 'returned' ? <><h3>Kiểm tra hàng trả lại</h3>{inspectionSummary ? <div className="admin-detail-grid"><div><span>Tiến độ kiểm tra</span><strong>{inspectionSummary.inspectedAssetCount} / {inspectionSummary.requiredAssetCount}</strong></div><div><span>Đề xuất khấu trừ cọc</span><strong>{formatVnd(inspectionSummary.totalRecommendedDeduction)}</strong></div><div><span>Đề xuất hoàn lại</span><strong>{formatVnd(inspectionSummary.recommendedRefund)}</strong></div></div> : null}<div className="admin-inspection-list">{inspectionAssets.map((asset) => <div className="admin-refund-row" key={asset.productInventoryItemId}><div><strong>{asset.assetCode}</strong><span>{asset.productName} · {asset.size} / {asset.color} · {asset.operationalStatus}</span><small>{asset.inspection ? `${asset.inspection.conditionAfterReturn} · Khấu trừ ${formatVnd(asset.inspection.recommendedDeduction)}` : 'Chưa kiểm tra'}</small></div><button className="admin-secondary-button" onClick={() => openInspection(asset)} type="button">{asset.inspection ? 'Sửa kiểm tra' : 'Kiểm tra'}</button></div>)}</div>{inspectionAsset ? <form className="admin-detail-status" onSubmit={saveInspection}><label htmlFor="inspection-condition">Món đồ {inspectionAsset.assetCode}</label><select id="inspection-condition" onChange={(event) => setInspectionCondition(event.target.value)} value={inspectionCondition}>{['NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED'].map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select><label><input checked={inspectionDamage} onChange={(event) => { setInspectionDamage(event.target.checked); if (!event.target.checked) setInspectionDeduction('0'); }} type="checkbox" /> Phát hiện hư hỏng / lỗi</label><textarea maxLength={1000} onChange={(event) => setInspectionDescription(event.target.value)} placeholder="Mô tả chi tiết hư hỏng" value={inspectionDescription} /><input max={inspectionAsset.depositAllocation} min="0" onChange={(event) => setInspectionDeduction(event.target.value)} step="0.01" type="number" value={inspectionDeduction} /><small>Khấu trừ tối đa: {formatVnd(inspectionAsset.depositAllocation)}</small>{inspectionError ? <div className="admin-error-message">{inspectionError}</div> : null}<div className="admin-status-form"><button className="admin-primary-button" disabled={inspectionSaving} type="submit">{inspectionSaving ? 'Đang lưu...' : 'Lưu kết quả'}</button><button className="admin-secondary-button" onClick={() => setInspectionAsset(null)} type="button">Hủy bỏ</button></div></form> : null}</> : null}
        <h3>Hoàn tiền và ảnh chuyển khoản</h3>
        {refundError ? <div className="admin-error-message">{refundError}</div> : null}
        {refunds.length > 0 ? refunds.map((refund) => <AdminRefundEvidence key={refund.id} refund={refund} disabled={refundSaving} onStatusChange={processRefund} onUpdated={(updated) => onRefundsUpdated(refunds.map((item) => item.id === updated.id ? updated : item))} />) : <div className="admin-muted">Chưa có bản ghi hoàn tiền nào.</div>}
        {order.status === 'returned' && payment?.status === 'paid' && !refunds.some((refund) => refund.type === 'deposit' && !['rejected', 'cancelled'].includes(refund.status)) ? <DepositSettlementForm deposit={payment.depositAmount} amount={refundAmount} reason={refundReason} saving={refundSaving} error={refundError} onAmountChange={setRefundAmount} onReasonChange={setRefundReason} onSubmit={settleDeposit} /> : null}
        <h3>Danh sách sản phẩm</h3>
        <div className="admin-detail-items">{(order.items || []).map((item) => <div className="admin-detail-item" key={item.id}><img alt="" onError={(event) => event.currentTarget.removeAttribute('src')} src={imageUrl(item.image)} /><div><strong>{item.name}</strong><span>{item.size} / {item.color} · SL {item.qty}</span><small>{item.rentalStartDate} - {item.rentalEndDate} · {item.rentalDays} ngày</small></div><b>{formatVnd(item.lineSubtotal)}</b></div>)}</div>
        <div className="admin-detail-status"><div><span>Trạng thái hiện tại</span><strong className={`admin-status-pill ${order.status}`}>{statusLabel(order.status)}</strong>{order.status === 'returned' ? <small className="admin-lifecycle-note">Đã hoàn tất trả hàng. Các món đồ đang chờ vệ sinh/giặt sấy.</small> : null}</div>{nextStatuses.length > 0 ? <form onSubmit={saveStatus}><label htmlFor="admin-next-status">Cập nhật trạng thái</label><div className="admin-status-form"><select id="admin-next-status" onChange={(event) => setStatus(event.target.value)} value={status}><option value={order.status}>{statusLabel(order.status)}</option>{nextStatuses.map((next) => <option key={next} value={next}>{statusLabel(next)}</option>)}</select><button className="admin-primary-button" disabled={saving || status === order.status} type="submit">{saving ? 'Đang lưu...' : 'Lưu'}</button></div><textarea maxLength={500} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú (tuỳ chọn)" value={note} />{error ? <div className="admin-error-message">{error}</div> : null}</form> : <span className="admin-muted">Đơn hàng đã ở trạng thái cuối, không thể chuyển tiếp trạng thái.</span>}</div>
        <h3>Lịch sử trạng thái</h3>
        <div className="admin-history-list">{(order.history || []).map((entry, index) => <div key={`${entry.at}-${index}`}><strong>{statusLabel(entry.status)}</strong><span>{entry.note || 'Thay đổi trạng thái'}</span><small>{formatOrderDate(entry.at)}</small></div>)}</div>
      </section>
    </div>
  );
}

export default function AdminPage({ defaultTab = 'orders' }) {
  useDocumentTitle('Bảng Điều Khiển Quản Trị | DoRentMe');
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || defaultTab;
  const isTrafficTab = currentTab === 'traffic' || currentTab === 'analytics';

  const [orders, setOrders] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedReturnShipment, setSelectedReturnShipment] = useState(null);
  const [selectedTransactions, setSelectedTransactions] = useState([]);
  const [selectedRefunds, setSelectedRefunds] = useState([]);
  const [selectedInspectionAssets, setSelectedInspectionAssets] = useState([]);
  const [selectedInspectionSummary, setSelectedInspectionSummary] = useState(null);
  const [shippers, setShippers] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  async function loadOrders(nextFilters = filters) {
    setLoading(true); setError('');
    try { setOrders(await fetchAdminOrders(nextFilters)); } catch (requestError) { if (requestError?.response?.status === 401) clearSession(); setError(getApiErrorMessage(requestError, 'Unable to load orders.')); } finally { setLoading(false); }
  }

  useEffect(() => { fetchAdminSession().catch((requestError) => { if (requestError?.response?.status === 401) clearSession(); }); fetchAdminShippers().then(setShippers).catch(() => setShippers([])); loadOrders().catch(() => {}); }, []);

  async function openDetail(id) {
    setSelectedId(id); setDetailLoading(true); setSelectedOrder(null); setSelectedPayment(null); setSelectedShipment(null); setSelectedReturnShipment(null); setSelectedTransactions([]); setSelectedRefunds([]); setSelectedInspectionAssets([]); setSelectedInspectionSummary(null);
    try { const [order, payment, refunds, inspectionAssets, inspectionSummary] = await Promise.all([fetchAdminOrder(id), fetchAdminPayment(id), fetchAdminRefunds({ orderId: id }), fetchInspectionAssets(id), fetchInspectionSummary(id)]); const transactions = payment ? await fetchAdminPaymentTransactions(payment.id) : []; const shipments = await fetchAdminShipments(id).catch(() => []); setSelectedOrder(order); setSelectedPayment(payment); setSelectedShipment(shipments.find((item) => item.direction === 'outbound') || null); setSelectedReturnShipment(shipments.find((item) => item.direction === 'return') || null); setSelectedTransactions(transactions); setSelectedRefunds(refunds); setSelectedInspectionAssets(inspectionAssets); setSelectedInspectionSummary(inspectionSummary); } catch (requestError) { setError(getApiErrorMessage(requestError, 'Unable to load order detail.')); setSelectedId(null); } finally { setDetailLoading(false); }
  }

  async function refreshAfterUpdate(updated) {
    setSelectedOrder(updated);
    if (selectedId) {
      const [payment, refunds, inspectionAssets, inspectionSummary] = await Promise.all([fetchAdminPayment(selectedId), fetchAdminRefunds({ orderId: selectedId }), fetchInspectionAssets(selectedId), fetchInspectionSummary(selectedId)]);
      setSelectedPayment(payment);
      const shipments = await fetchAdminShipments(selectedId).catch(() => []);
      setSelectedShipment(shipments.find((item) => item.direction === 'outbound') || null);
      setSelectedReturnShipment(shipments.find((item) => item.direction === 'return') || null);
      setSelectedTransactions(payment ? await fetchAdminPaymentTransactions(payment.id) : []);
      setSelectedRefunds(refunds);
      setSelectedInspectionAssets(inspectionAssets);
      setSelectedInspectionSummary(inspectionSummary);
    }
    await loadOrders();
  }
  function refreshPayment(updated) { setSelectedPayment(updated); fetchAdminPaymentTransactions(updated.id).then(setSelectedTransactions).catch(() => {}); }
  function refreshShipment(updated) { setSelectedShipment(updated); }
  function refreshReturnShipment(updated) { setSelectedReturnShipment(updated); }
  async function refreshInspection(updated) { setSelectedInspectionAssets((assets) => assets.map((asset) => asset.productInventoryItemId === updated.productInventoryItemId ? { ...asset, inspection: updated, operationalStatus: asset.operationalStatus } : asset)); setSelectedInspectionSummary(await fetchInspectionSummary(selectedId)); }

  function changeFilter(name, value) { const next = { ...filters, [name]: value }; setFilters(next); loadOrders(next).catch(() => {}); }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          <h1>Bảng Điều Khiển Quản Trị DoRentMe</h1>
        </div>
        <div className="admin-nav-tabs">
          <button
            type="button"
            className={`admin-tab-btn ${!isTrafficTab ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'orders' })}
          >
            📦 Quản lý Đơn hàng
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${isTrafficTab ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'traffic' })}
          >
            📊 Thống kê Lượt truy cập & GA
          </button>
        </div>
        <div className="inventory-admin-links">
          <Link to="/admin/inventory">Kho hàng</Link>
          <span>Quản trị viên</span>
        </div>
      </header>

      {isTrafficTab ? (
        <main className="admin-body">
          <AdminTrafficDashboard />
        </main>
      ) : (
        <main className="admin-body admin-orders-page">
          <div className="admin-page-heading">
            <div>
              <span className="admin-kicker">Vận hành</span>
              <h2>Quản lý Đơn hàng</h2>
              <p>Quản lý các đơn hàng được khách đặt qua trang thanh toán.</p>
            </div>
            <button className="admin-secondary-button" disabled={loading} onClick={() => loadOrders()} type="button">Làm mới</button>
          </div>
          <div className="admin-order-filters">
            <label>Tìm kiếm<input onChange={(event) => changeFilter('search', event.target.value)} placeholder="Mã đơn, tên khách hoặc email..." value={filters.search} /></label>
            <label>Trạng thái<select onChange={(event) => changeFilter('status', event.target.value)} value={filters.status}><option value="">Tất cả trạng thái</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
          </div>
          {error ? <div className="admin-error-message">{error}</div> : null}
          {loading ? <div className="admin-empty">Đang tải danh sách đơn hàng...</div> : orders.length === 0 ? <div className="admin-empty">Không có đơn hàng nào khớp với bộ lọc.</div> : <div className="admin-orders-table-wrap"><table className="admin-orders-table"><thead><tr><th>Đơn hàng</th><th>Khách hàng</th><th>Cửa hàng</th><th>Số món</th><th>Thời gian thuê</th><th>Tổng tiền</th><th>Trạng thái</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderCode}</strong><small>{formatOrderDate(order.createdAt)}</small></td><td><strong>{order.customerName}</strong><small>{order.customerEmail || '-'}</small></td><td>{order.shopName || '-'}</td><td>{order.itemCount}</td><td>{order.startDate} - {order.endDate}</td><td>{formatVnd(order.total)}</td><td><span className={`admin-status-pill ${order.status}`}>{statusLabel(order.status)}</span></td><td><button className="admin-secondary-button" onClick={() => openDetail(order.id)} type="button">Xem chi tiết</button></td></tr>)}</tbody></table></div>}
        </main>
      )}

      {selectedId ? (detailLoading ? <div className="admin-modal-backdrop"><section className="admin-modal admin-empty">Đang tải chi tiết đơn hàng...</section></div> : selectedOrder ? <OrderDetail inspectionAssets={selectedInspectionAssets} inspectionSummary={selectedInspectionSummary} onClose={() => { setSelectedId(null); setSelectedOrder(null); setSelectedPayment(null); setSelectedShipment(null); setSelectedReturnShipment(null); setSelectedTransactions([]); setSelectedRefunds([]); setSelectedInspectionAssets([]); setSelectedInspectionSummary(null); }} onInspectionUpdated={refreshInspection} onPaymentUpdated={refreshPayment} onShipmentUpdated={refreshShipment} onReturnShipmentUpdated={refreshReturnShipment} onRefundsUpdated={setSelectedRefunds} onUpdated={refreshAfterUpdate} order={selectedOrder} payment={selectedPayment} refunds={selectedRefunds} returnShipment={selectedReturnShipment} shipment={selectedShipment} shippers={shippers} transactions={selectedTransactions} /> : null) : null}
    </div>
  );
}
