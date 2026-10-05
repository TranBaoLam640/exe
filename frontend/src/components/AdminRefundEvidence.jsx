import { useEffect, useState } from 'react';
import EvidenceGallery from './EvidenceGallery.jsx';
import { uploadEvidencePhotos } from '../features/orders/evidenceApi.js';
import { publishRefundProof, updateAdminRefundStatus } from '../features/admin/adminService.js';
import { formatVnd } from '../features/cart/cartService.js';
import { getApiErrorMessage } from '../utils/apiError.js';

export default function AdminRefundEvidence({ refund, onUpdated, onStatusChange, disabled }) {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [photoIds, setPhotoIds] = useState([]);
  const [transactionCode, setTransactionCode] = useState(refund.transactionCode || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const isDeposit = refund.type === 'deposit';
  const canSend = isDeposit && ['pending', 'processing', 'completed'].includes(refund.status);

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
    <div className="admin-refund-evidence-heading"><strong>{isDeposit ? 'Hoàn tiền cọc' : 'Hoàn tiền hủy đơn'} · {formatVnd(refund.amount)}</strong><span>{refund.status}</span></div>
    {refund.reason ? <p>{refund.reason}</p> : null}
    {refund.proofPhotoIds?.length ? <><h4>Ảnh chuyển khoản đã gửi cho khách ({refund.proofPhotoIds.length})</h4><EvidenceGallery ids={refund.proofPhotoIds} label="Chứng minh chuyển khoản hoàn cọc" /></> : null}
    {canSend ? <form onSubmit={sendProof} className="admin-transfer-proof-form">
      <h4>{refund.status === 'completed' ? 'Gửi thêm ảnh chuyển khoản cho khách' : 'Gửi ảnh chuyển khoản hoàn cọc cho khách'}</h4>
      <p>Đính kèm ảnh giao dịch chuyển khoản thành công. Khách sẽ xem ảnh trong trang theo dõi đơn hàng sau khi bạn gửi.</p>
      <label className="admin-transfer-proof-upload">Chọn ảnh chuyển khoản
        <input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={saving || disabled} onChange={(event) => { setFiles(Array.from(event.target.files || [])); setPhotoIds([]); setError(''); }} />
        <small>Ít nhất 1 ảnh · Tối đa 10 ảnh · 5 MB/ảnh</small>
      </label>
      {previews.length ? <div className="admin-transfer-proof-previews">{previews.map((url, index) => <img key={url} src={url} alt={`Ảnh chuyển khoản đã chọn ${index + 1}`} />)}</div> : null}
      {refund.status !== 'completed' ? <label>Mã giao dịch (không bắt buộc)<input maxLength={100} value={transactionCode} onChange={(event) => setTransactionCode(event.target.value)} disabled={saving || disabled} /></label> : null}
      {error ? <div className="admin-error-message" role="alert">{error}</div> : null}
      <button className="admin-primary-button" disabled={saving || disabled || !files.length} type="submit">{saving ? 'Đang gửi ảnh...' : refund.status === 'completed' ? 'Gửi ảnh cho khách' : 'Xác nhận đã chuyển khoản và gửi ảnh'}</button>
    </form> : null}
    {['pending', 'processing'].includes(refund.status) ? <div className="admin-refund-evidence-actions">
      {refund.status === 'pending' ? <button className="admin-secondary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'processing')} type="button">Đang xử lý</button> : null}
      {!isDeposit ? <button className="admin-primary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'completed')} type="button">Hoàn tất</button> : null}
      <button className="admin-secondary-button" disabled={saving || disabled} onClick={() => onStatusChange(refund, 'rejected')} type="button">Từ chối</button>
    </div> : null}
  </section>;
}
