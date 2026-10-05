import AdminRefundEvidence from '../components/AdminRefundEvidence.jsx';
import DepositReturnProgress from '../components/DepositReturnProgress.jsx';
import EvidenceGallery from '../components/EvidenceGallery.jsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { createAdminReturnShipment, createAdminShipment, createDepositSettlement, createInspection, fetchAdminOrder, fetchAdminOrders, fetchAdminPayment, fetchAdminPaymentTransactions, fetchAdminRefunds, fetchAdminSession, fetchAdminShipments, fetchAdminShippers, fetchInspectionAssets, fetchInspectionSummary, updateAdminPaymentStatus, updateAdminRefundStatus, updateAdminShipment, updateInspection } from '../features/admin/adminService.js';
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
        <div className="admin-modal-head"><div><span className="admin-kicker">Order detail</span><h2 id="admin-order-detail-title">{order.code || order.id}</h2></div><button aria-label="Close order detail" className="admin-icon-button" onClick={onClose} type="button">x</button></div>
        <div className="admin-detail-grid">
          <div><span>Customer</span><strong>{order.customer?.name || '-'}</strong><small>{order.customer?.email || order.customer?.phone || '-'}</small></div>
          <div><span>Shop</span><strong>{order.shopName || '-'}</strong><small>{order.customer?.phone || '-'}</small></div>
          <div><span>Rental period</span><strong>{order.startDate || '-'} - {order.endDate || '-'}</strong><small>Created {formatOrderDate(order.createdAt)}</small></div>
          <div><span>Totals</span><strong>{formatVnd(order.totals?.total)}</strong><small>Deposit {formatVnd(order.totals?.deposit)}</small></div>
        </div>
        <section className="admin-customer-return-evidence">
          <div className="admin-refund-evidence-heading"><h3>Ảnh khách gửi khi trả hàng</h3><span>{order.returnPhotoIds?.length || 0} ảnh</span></div>
          {order.returnPhotoIds?.length ? <><p>Kiểm tra tình trạng hàng qua ảnh của khách trước khi xử lý trả hàng. Nhấn vào ảnh để xem bản đầy đủ.</p><EvidenceGallery ids={order.returnPhotoIds} label="Ảnh khách gửi khi trả hàng" /></> : <p>Đơn hàng này chưa có ảnh trả hàng được gửi thành công.</p>}
        </section>
        {Number(order.totals?.deposit) > 0 && ['return_requested', 'return_processing', 'returned'].includes(order.status) ? <DepositReturnProgress order={order} refunds={refunds} admin /> : null}
        {payment ? <>
          <h3>Payment</h3>
          <div className="admin-detail-grid">
            <div><span>Status</span><strong>{payment.status}</strong><small>{payment.method}</small></div>
            <div><span>Amounts</span><strong>{formatVnd(payment.amount)}</strong><small>Rent {formatVnd(payment.rentalAmount)} / Deposit {formatVnd(payment.depositAmount)} / Discount {formatVnd(payment.discountAmount)}</small></div>
            <div><span>Bank transfer</span><strong>{payment.bankName || '-'}</strong><small>{payment.bankAccountNo || '-'} / {payment.bankAccountName || '-'}</small></div>
            <div><span>Transfer content</span><strong>{payment.transferContent || '-'}</strong><small>{payment.paidAt ? `Paid ${formatOrderDate(payment.paidAt)}` : 'Not paid'}</small></div>
          </div>
          {paymentTransitions.length > 0 ? <form className="admin-detail-status" onSubmit={savePaymentStatus}><label htmlFor="admin-payment-status">Update payment</label><div className="admin-status-form"><select id="admin-payment-status" onChange={(event) => setPaymentStatus(event.target.value)} value={paymentStatus}><option value={payment.status}>{payment.status}</option>{paymentTransitions.map((next) => <option key={next} value={next}>{next}</option>)}</select><input maxLength={100} onChange={(event) => setTransactionCode(event.target.value)} placeholder="Transaction code (optional)" value={transactionCode} /><button className="admin-primary-button" disabled={paymentSaving || paymentStatus === payment.status} type="submit">{paymentSaving ? 'Saving...' : 'Save payment'}</button></div>{paymentError ? <div className="admin-error-message">{paymentError}</div> : null}</form> : <div className="admin-muted">Payment status is final. Deposit refunds and transfer proof are managed below.</div>}
          {transactions.length > 0 ? <div className="admin-history-list"><strong>PayOS transactions</strong>{transactions.map((transaction) => <div key={transaction.id}><span>#{transaction.id} {transaction.status} · {formatVnd(transaction.amount)}</span><small>{transaction.providerOrderCode} · {formatOrderDate(transaction.createdAt)}{transaction.paidAt ? ` · Paid ${formatOrderDate(transaction.paidAt)}` : ''}</small></div>)}</div> : null}
        </> : <div className="admin-muted">Payment record is not available for this order.</div>}
        <h3>Shipment</h3>
        {shipment ? <div className="admin-detail-status"><div className="admin-detail-grid"><div><span>Status</span><strong>{shipment.status}</strong><small>{shipment.provider}</small></div><div><span>Tracking</span><strong>{shipment.trackingCode || '-'}</strong><small>{shipment.receiverName} · {shipment.receiverPhone}</small></div><div><span>Address</span><strong>{shipment.receiverAddress}</strong></div><div><span>Assigned shipper</span><strong>{shipment.assignedShipperName || '-'}</strong><small>{shipment.assignedShipperPhone || shipment.assignedShipperEmail || 'Not assigned'}</small></div></div><form onSubmit={saveShipmentAssignment}><label htmlFor="admin-shipment-shipper">Assign shipment to shipper</label><div className="admin-status-form"><select id="admin-shipment-shipper" onChange={(event) => setShipmentShipperId(event.target.value)} value={shipmentShipperId}><option value="">Choose shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={shipmentSaving || Number(shipmentShipperId) === shipment.assignedShipperUserId} type="submit">{shipmentSaving ? 'Saving...' : 'Save assignment'}</button></div><small className="admin-muted">Shipment status is updated by the assigned shipper.</small>{shipmentError ? <div className="admin-error-message">{shipmentError}</div> : null}</form>{shipment.trackingEvents?.length ? <div className="admin-history-list">{shipment.trackingEvents.map((event) => <div key={event.id}><strong>{event.status}</strong><span>{event.message || 'Shipment update'}</span><small>{formatOrderDate(event.createdAt)}</small></div>)}</div> : null}</div> : order.status === 'pending_confirmation' ? <form className="admin-detail-status" onSubmit={createShipment}><div className="admin-status-form"><input maxLength={50} onChange={(event) => setShipmentProvider(event.target.value)} placeholder="Provider (manual)" value={shipmentProvider} /><input maxLength={100} onChange={(event) => setShipmentTrackingCode(event.target.value)} placeholder="Tracking code (optional)" value={shipmentTrackingCode} /><select onChange={(event) => setShipmentShipperId(event.target.value)} value={shipmentShipperId}><option value="">Choose shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={shipmentSaving} type="submit">{shipmentSaving ? 'Creating...' : 'Create shipment'}</button></div>{shipmentError ? <div className="admin-error-message">{shipmentError}</div> : null}</form> : <div className="admin-muted">Shipment can be created before dispatch.</div>}
        <h3>Return shipment</h3>
        {returnShipment ? <div className="admin-detail-status"><div className="admin-detail-grid"><div><span>Status</span><strong>{returnShipment.status}</strong><small>{returnShipment.provider}</small></div><div><span>Tracking</span><strong>{returnShipment.trackingCode || '-'}</strong><small>{returnShipment.senderName} · {returnShipment.senderPhone}</small></div><div><span>Return address</span><strong>{returnShipment.receiverAddress}</strong></div><div><span>Assigned shipper</span><strong>{returnShipment.assignedShipperName || '-'}</strong><small>{returnShipment.assignedShipperPhone || returnShipment.assignedShipperEmail || 'Not assigned'}</small></div></div><form onSubmit={saveReturnShipmentAssignment}><label htmlFor="admin-return-shipment-shipper">Assign return shipment to shipper</label><div className="admin-status-form"><select id="admin-return-shipment-shipper" onChange={(event) => setReturnShipmentShipperId(event.target.value)} value={returnShipmentShipperId}><option value="">Choose shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={returnShipmentSaving || Number(returnShipmentShipperId) === returnShipment.assignedShipperUserId} type="submit">{returnShipmentSaving ? 'Saving...' : 'Save assignment'}</button></div><small className="admin-muted">Return shipment status is updated by the assigned shipper.</small>{returnShipmentError ? <div className="admin-error-message">{returnShipmentError}</div> : null}</form>{returnShipment.trackingEvents?.length ? <div className="admin-history-list">{returnShipment.trackingEvents.map((event) => <div key={event.id}><strong>{event.status}</strong><span>{event.message || 'Return shipment update'}</span><small>{formatOrderDate(event.createdAt)}</small></div>)}</div> : null}</div> : order.status === 'return_requested' ? <form className="admin-detail-status" onSubmit={createReturnShipment}><div className="admin-status-form"><input maxLength={50} onChange={(event) => setReturnShipmentProvider(event.target.value)} placeholder="Provider (manual)" value={returnShipmentProvider} /><input maxLength={100} onChange={(event) => setReturnShipmentTrackingCode(event.target.value)} placeholder="Tracking code (optional)" value={returnShipmentTrackingCode} /><select onChange={(event) => setReturnShipmentShipperId(event.target.value)} value={returnShipmentShipperId}><option value="">Choose shipper</option>{shippers.map((shipper) => <option key={shipper.id} value={shipper.id}>{shipper.name} ({shipper.email})</option>)}</select><button className="admin-primary-button" disabled={returnShipmentSaving} type="submit">{returnShipmentSaving ? 'Creating...' : 'Create return shipment'}</button></div>{returnShipmentError ? <div className="admin-error-message">{returnShipmentError}</div> : null}</form> : <div className="admin-muted">Return shipment is available after the customer requests a return.</div>}
        <h3>Hoàn tiền và ảnh chuyển khoản</h3>
        {refundError ? <div className="admin-error-message">{refundError}</div> : null}
        {refunds.length > 0 ? refunds.map((refund) => <AdminRefundEvidence key={refund.id} refund={refund} disabled={refundSaving} onStatusChange={processRefund} onUpdated={(updated) => onRefundsUpdated(refunds.map((item) => item.id === updated.id ? updated : item))} />) : <div className="admin-muted">No refunds recorded.</div>}
        {order.status === 'returned' && payment?.status === 'paid' && !refunds.some((refund) => refund.type === 'deposit' && !['rejected', 'cancelled'].includes(refund.status)) ? <form className="admin-detail-status" onSubmit={settleDeposit}><label htmlFor="admin-refund-amount">Settle deposit</label><div className="admin-status-form"><input id="admin-refund-amount" min="0" onChange={(event) => setRefundAmount(event.target.value)} step="0.01" type="number" value={refundAmount} /><button className="admin-primary-button" disabled={refundSaving} type="submit">{refundSaving ? 'Saving...' : 'Create settlement'}</button></div><small>Original deposit: {formatVnd(payment.depositAmount)} · Deduction: {formatVnd(Math.max(0, Number(payment.depositAmount) - Number(refundAmount || 0)))}</small><textarea maxLength={500} onChange={(event) => setRefundReason(event.target.value)} placeholder="Reason required for a partial or zero refund" value={refundReason} />{refundError ? <div className="admin-error-message">{refundError}</div> : null}</form> : null}
        {order.status === 'returned' ? <><h3>Return inspection</h3>{inspectionSummary ? <div className="admin-detail-grid"><div><span>Inspection progress</span><strong>{inspectionSummary.inspectedAssetCount} / {inspectionSummary.requiredAssetCount}</strong></div><div><span>Recommended deduction</span><strong>{formatVnd(inspectionSummary.totalRecommendedDeduction)}</strong></div><div><span>Recommended refund</span><strong>{formatVnd(inspectionSummary.recommendedRefund)}</strong></div></div> : null}<div className="admin-inspection-list">{inspectionAssets.map((asset) => <div className="admin-refund-row" key={asset.productInventoryItemId}><div><strong>{asset.assetCode}</strong><span>{asset.productName} · {asset.size} / {asset.color} · {asset.operationalStatus}</span><small>{asset.inspection ? `${asset.inspection.conditionAfterReturn} · Deduction ${formatVnd(asset.inspection.recommendedDeduction)}` : 'Not inspected'}</small></div><button className="admin-secondary-button" onClick={() => openInspection(asset)} type="button">{asset.inspection ? 'Edit inspection' : 'Inspect'}</button></div>)}</div>{inspectionAsset ? <form className="admin-detail-status" onSubmit={saveInspection}><label htmlFor="inspection-condition">Asset {inspectionAsset.assetCode}</label><select id="inspection-condition" onChange={(event) => setInspectionCondition(event.target.value)} value={inspectionCondition}>{['NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED'].map((condition) => <option key={condition} value={condition}>{condition}</option>)}</select><label><input checked={inspectionDamage} onChange={(event) => { setInspectionDamage(event.target.checked); if (!event.target.checked) setInspectionDeduction('0'); }} type="checkbox" /> Damage found</label><textarea maxLength={1000} onChange={(event) => setInspectionDescription(event.target.value)} placeholder="Damage description" value={inspectionDescription} /><input max={inspectionAsset.depositAllocation} min="0" onChange={(event) => setInspectionDeduction(event.target.value)} step="0.01" type="number" value={inspectionDeduction} /><small>Maximum deduction: {formatVnd(inspectionAsset.depositAllocation)}</small>{inspectionError ? <div className="admin-error-message">{inspectionError}</div> : null}<div className="admin-status-form"><button className="admin-primary-button" disabled={inspectionSaving} type="submit">{inspectionSaving ? 'Saving...' : 'Save inspection'}</button><button className="admin-secondary-button" onClick={() => setInspectionAsset(null)} type="button">Cancel</button></div></form> : null}</> : null}
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
      <header className="admin-header"><div className="admin-brand"><img alt="DoRentMe" src={imageUrl('Logo.png')} /><h1>DoRentMe Admin Orders</h1></div><div className="inventory-admin-links"><Link to="/admin/inventory">Inventory</Link><span>JWT Admin</span></div></header>
      <main className="admin-body admin-orders-page">
        <div className="admin-page-heading"><div><span className="admin-kicker">Operations</span><h2>Orders</h2><p>Manage orders persisted by checkout.</p></div><button className="admin-secondary-button" disabled={loading} onClick={() => loadOrders()} type="button">Refresh</button></div>
        <div className="admin-order-filters"><label>Search<input onChange={(event) => changeFilter('search', event.target.value)} placeholder="Code, customer or email" value={filters.search} /></label><label>Status<select onChange={(event) => changeFilter('status', event.target.value)} value={filters.status}><option value="">All statuses</option>{STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label></div>
        {error ? <div className="admin-error-message">{error}</div> : null}
        {loading ? <div className="admin-empty">Loading orders...</div> : orders.length === 0 ? <div className="admin-empty">No database orders match these filters.</div> : <div className="admin-orders-table-wrap"><table className="admin-orders-table"><thead><tr><th>Order</th><th>Customer</th><th>Shop</th><th>Items</th><th>Rental period</th><th>Total</th><th>Status</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.orderCode}</strong><small>{formatOrderDate(order.createdAt)}</small></td><td><strong>{order.customerName}</strong><small>{order.customerEmail || '-'}</small></td><td>{order.shopName || '-'}</td><td>{order.itemCount}</td><td>{order.startDate} - {order.endDate}</td><td>{formatVnd(order.total)}</td><td><span className={`admin-status-pill ${order.status}`}>{statusLabel(order.status)}</span></td><td><button className="admin-secondary-button" onClick={() => openDetail(order.id)} type="button">View</button></td></tr>)}</tbody></table></div>}
      </main>
      {selectedId ? (detailLoading ? <div className="admin-modal-backdrop"><section className="admin-modal admin-empty">Loading order detail...</section></div> : selectedOrder ? <OrderDetail inspectionAssets={selectedInspectionAssets} inspectionSummary={selectedInspectionSummary} onClose={() => { setSelectedId(null); setSelectedOrder(null); setSelectedPayment(null); setSelectedShipment(null); setSelectedReturnShipment(null); setSelectedTransactions([]); setSelectedRefunds([]); setSelectedInspectionAssets([]); setSelectedInspectionSummary(null); }} onInspectionUpdated={refreshInspection} onPaymentUpdated={refreshPayment} onShipmentUpdated={refreshShipment} onReturnShipmentUpdated={refreshReturnShipment} onRefundsUpdated={setSelectedRefunds} onUpdated={refreshAfterUpdate} order={selectedOrder} payment={selectedPayment} refunds={selectedRefunds} returnShipment={selectedReturnShipment} shipment={selectedShipment} shippers={shippers} transactions={selectedTransactions} /> : null) : null}
    </div>
  );
}
