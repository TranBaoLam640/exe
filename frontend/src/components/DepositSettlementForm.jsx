import { formatVnd } from '../features/cart/cartService.js';

export default function DepositSettlementForm({ deposit, amount, reason, saving, error, onAmountChange, onReasonChange, onSubmit }) {
  const refund = Number(amount || 0);
  const deduction = Math.max(0, Number(deposit) - refund);
  return <form className="deposit-settlement-form" onSubmit={onSubmit}>
    <div className="refund-section-title"><span className="refund-step-number">1</span><div><h4>Xác định số tiền hoàn cọc</h4><p>Đối chiếu tình trạng hàng trước khi tạo khoản hoàn tiền.</p></div></div>
    <div className="refund-amount-summary">
      <div><span>Tiền cọc ban đầu</span><strong>{formatVnd(deposit)}</strong></div>
      <div><span>Giữ lại / khấu trừ</span><strong>{formatVnd(deduction)}</strong></div>
      <div className="refund-amount-highlight"><span>Hoàn lại cho khách</span><strong>{formatVnd(Number.isFinite(refund) ? refund : 0)}</strong></div>
    </div>
    <div className="deposit-settlement-fields">
      <label htmlFor="admin-refund-amount">Số tiền hoàn lại <span className="refund-field-unit">VND</span><input id="admin-refund-amount" min="0" max={deposit} onChange={(event) => onAmountChange(event.target.value)} step="0.01" type="number" value={amount} disabled={saving} /></label>
      <label htmlFor="admin-refund-reason">Lý do khấu trừ / ghi chú<textarea id="admin-refund-reason" maxLength={500} onChange={(event) => onReasonChange(event.target.value)} placeholder="Nêu tình trạng hàng và lý do nếu hoàn ít hơn tiền cọc ban đầu" value={reason} disabled={saving} rows={3} /></label>
    </div>
    {error ? <div className="admin-error-message" role="alert">{error}</div> : null}
    <div className="refund-form-footer"><p>Sau khi tạo khoản hoàn tiền, đính kèm ảnh chuyển khoản để gửi cho khách.</p><button className="admin-primary-button" disabled={saving} type="submit">{saving ? 'Đang tạo...' : 'Tạo khoản hoàn cọc'}</button></div>
  </form>;
}
