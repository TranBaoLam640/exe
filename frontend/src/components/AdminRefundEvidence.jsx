import { useEffect, useId, useState } from 'react';
import EvidenceGallery from './EvidenceGallery.jsx';
import { uploadEvidencePhotos } from '../features/orders/evidenceApi.js';
import { publishRefundProof, updateAdminRefundStatus } from '../features/admin/adminService.js';
import { formatVnd } from '../features/cart/cartService.js';
import { getApiErrorMessage } from '../utils/apiError.js';

export default function AdminRefundEvidence({ refund, onUpdated, onStatusChange, disabled }) {
  const uploadId = useId();
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoIds, setPhotoIds] = useState([]);
  const [transactionCode, setTransactionCode] = useState(refund.transactionCode || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isDeposit = refund.type === 'deposit';
  const canSend = isDeposit && ['pending', 'processing', 'completed'].includes(refund.status);
  const statusLabels = { pending: 'Chờ hoàn tiền', processing: 'Đang xử lý', completed: 'Đã hoàn tiền', rejected: 'Đã từ chối', cancelled: 'Đã hủy' };

  function selectFiles(selected) {
    setError('');
    if (selected.length > 10 || selected.some((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      setError('Chọn tối đa 10 ảnh JPEG, PNG hoặc WebP, mỗi ảnh không quá 5 MB.');
      return;
    }
    setFiles(selected);
    setPhotoIds([]);
  }

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  async function sendProof(event) {
    event.preventDefault();
    if (saving || disabled) return;
    setError('');
    if (!files.length) { setError('Chọn ít nhất 1 ảnh chứng minh chuyển khoản hoàn cọc.'); return; }
    setSaving(true);
    try {
      const ids = photoIds.length ? photoIds : await uploadEvidencePhotos(`/api/admin/refunds/${refund.id}/proof-photos`, files);
      setPhotoIds(ids);
      const updated = refund.status === 'completed'
        ? await publishRefundProof(refund.id, ids)
        : await updateAdminRefundStatus(refund.id, 'completed', transactionCode, ids);
      onUpdated(updated);
      setFiles([]);
      setPhotoIds([]);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Không thể gửi ảnh chuyển khoản cho khách.'));
    } finally { setSaving(false); }
  }

  return <section className="admin-refund-evidence">
    <header className="refund-card-header"><div><span className="refund-card-kicker">{isDeposit ? 'Hoàn tiền cọc' : 'Hoàn tiền hủy đơn'} · #{refund.id}</span><strong className="refund-card-amount">{formatVnd(refund.amount)}</strong></div><span className={`refund-status-badge ${refund.status}`}>{statusLabels[refund.status] || refund.status}</span></header>
    {refund.reason ? <div className="refund-note"><span>Ghi chú xử lý</span><p>{refund.reason}</p></div> : null}
    {refund.transactionCode ? <div className="refund-transaction-code"><span>Mã giao dịch</span><strong>{refund.transactionCode}</strong></div> : null}
    {refund.proofPhotoIds?.length ? <div className="refund-sent-proof"><h4>Ảnh chuyển khoản đã gửi <span>{refund.proofPhotoIds.length} ảnh</span></h4><p>Khách có thể xem bằng chứng trong trang theo dõi đơn hàng.</p><EvidenceGallery ids={refund.proofPhotoIds} label="Chứng minh hoàn cọc" /></div> : null}
    {canSend ? <details className="refund-proof-details" open={refund.status !== 'completed' || !refund.proofPhotoIds?.length}><summary>{refund.status === 'completed' ? 'Bổ sung ảnh chuyển khoản cho khách' : '2. Chuyển khoản và gửi bằng chứng'}</summary><form onSubmit={sendProof} className="admin-transfer-proof-form">
      <p>Chuyển khoản thành công rồi đính kèm ảnh giao dịch. Ảnh sẽ được gửi cho khách khi bạn xác nhận.</p>
      <label className={`admin-transfer-proof-upload${saving || disabled ? ' is-disabled' : ''}`} htmlFor={uploadId}>
        <input id={uploadId} className="refund-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving || disabled} onChange={(event) => { const selected = Array.from(event.target.files || []); if (selected.length) selectFiles([...files, ...selected]); event.target.value = ''; }} />
        <span className="refund-upload-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 16V4m-4 4 4-4 4 4M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></svg></span>
        <strong>{files.length ? 'Thêm ảnh chuyển khoản' : 'Chọn ảnh chuyển khoản'}</strong>
        <small>JPEG, PNG, WebP · Tối đa 5 MB/ảnh</small>
      </label>
      {previews.length ? <div className="admin-transfer-proof-previews">{previews.map((url, index) => <div className="refund-preview" key={url}><img src={url} alt={`Ảnh chuyển khoản đã chọn ${index + 1}`} /><button type="button" aria-label={`Xóa ảnh ${index + 1}`} disabled={saving || disabled} onClick={() => selectFiles(files.filter((_, fileIndex) => fileIndex !== index))}>×</button><span title={files[index]?.name}>{files[index]?.name}</span></div>)}</div> : null}
      {refund.status !== 'completed' ? <label htmlFor={`${uploadId}-transaction`}>Mã giao dịch <small>Không bắt buộc</small><input id={`${uploadId}-transaction`} maxLength={100} placeholder="Nhập mã giao dịch ngân hàng" value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} disabled={saving || disabled} /></label> : null}
      {error ? <div className="admin-error-message" role="alert">{error}</div> : null}
      <div className="refund-form-footer"><p className={files.length ? 'refund-selection-ready' : ''}>{files.length ? `${files.length} ảnh đã chọn · Sẵn sàng gửi` : 'Cần ít nhất 1 ảnh chứng minh chuyển khoản.'}</p><button className="admin-primary-button" disabled={saving || disabled || !files.length} type="submit">{saving ? 'Đang gửi ảnh...' : refund.status === 'completed' ? 'Gửi ảnh cho khách' : 'Xác nhận hoàn cọc & gửi ảnh'}</button></div>
    </form></details> : null}
    {['pending', 'processing'].includes(refund.status) ? <div className="admin-refund-evidence-actions">
      {refund.status === 'pending' ? <button className="admin-secondary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'processing')} type="button">Đang xử lý</button> : null}
      {!isDeposit ? <button className="admin-primary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'completed')} type="button">Hoàn tất</button> : null}
      <button className="admin-secondary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'rejected')} type="button">Từ chối</button>
    </div> : null}
  </section>;
}
