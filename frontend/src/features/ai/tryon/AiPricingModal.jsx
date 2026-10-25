import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AI_PACKAGES, purchaseAiPackage } from './aiPackages.js';

export default function AiPricingModal({ isOpen, onClose, onPackagePurchased, initialSelectedPackageId }) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialSelectedPackageId || 'ai_day_pass');
  const [isCheckout, setIsCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  if (!isOpen) return null;

  const currentPkg = AI_PACKAGES.find((p) => p.id === selectedPkgId) || AI_PACKAGES[1];

  function handleSelectAndPay(pkgId) {
    setSelectedPkgId(pkgId);
    setIsCheckout(true);
    setPurchaseSuccess(null);
  }

  function handleDirectActivate() {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = purchaseAiPackage(currentPkg.id, 'instant');
        setIsProcessing(false);
        setPurchaseSuccess(result);
        if (onPackagePurchased) {
          onPackagePurchased(result);
        }
      } catch (err) {
        setIsProcessing(false);
        alert(err.message || 'Lỗi kích hoạt gói.');
      }
    }, 600);
  }

  function copyText(text, field) {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedField(field);
        setTimeout(() => setCopiedField(''), 2500);
      }).catch(() => {});
    }
  }

  function handlePayOsConfirm() {
    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = purchaseAiPackage(currentPkg.id, 'payos');
        setIsProcessing(false);
        setPurchaseSuccess(result);
        if (onPackagePurchased) {
          onPackagePurchased(result);
        }
      } catch (err) {
        setIsProcessing(false);
        alert(err.message || 'Lỗi kích hoạt gói.');
      }
    }, 600);
  }

  const bankName = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_BANK_NAME) || 'MBBank (Quân Đội)').trim();
  const bankId = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_BANK_ID) || 'MB').trim();
  const accountNumber = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_ACCOUNT_NUMBER) || '0394692818').trim();
  const accountHolder = ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_ACCOUNT_NAME) || 'NGUYEN DUC DUONG').trim();
  const payOsPaymentLink = typeof import.meta !== 'undefined'
    ? (currentPkg.id === 'ai_single'
      ? import.meta.env?.VITE_PAYOS_LINK_1K
      : currentPkg.id === 'ai_day_pass'
      ? import.meta.env?.VITE_PAYOS_LINK_10K
      : import.meta.env?.VITE_PAYOS_LINK_50K) || ''
    : '';

  const transferContent = `DORENTME AI ${currentPkg.price / 1000}K`;
  const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${currentPkg.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`;

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div className="ai-pricing-modal" role="dialog" aria-labelledby="ai-pricing-title">
        <button
          type="button"
          className="admin-icon-button ai-pricing-close"
          onClick={onClose}
          aria-label="Đóng bảng giá"
        >
          ✕
        </button>

        {!isCheckout ? (
          <>
            <div className="ai-pricing-head">
              <span className="tryon-badge">Bảng giá tiết kiệm</span>
              <h2 id="ai-pricing-title">Gói Thử Đồ Bằng AI Thông Minh</h2>
              <p>Chọn gói phù hợp để phối đồ thỏa thích với công nghệ AI thời trang thế hệ mới.</p>
            </div>

            <div className="ai-pricing-grid">
              {AI_PACKAGES.map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    className={`ai-pricing-card ${pkg.highlight ? 'featured' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedPkgId(pkg.id)}
                  >
                    {pkg.highlight ? <div className="ai-card-ribbon">Khuyên dùng</div> : null}
                    <div className="ai-card-badge">{pkg.badge}</div>
                    <h3 className="ai-card-title">{pkg.name}</h3>
                    <div className="ai-card-price-wrap">
                      <span className="ai-card-price">{pkg.priceDisplay}</span>
                      <span className="ai-card-unit">{pkg.unit}</span>
                    </div>
                    <p className="ai-card-desc">{pkg.description}</p>
                    <ul className="ai-card-features">
                      {pkg.features.map((feat, index) => (
                        <li key={index}>
                          <span className="check-icon" aria-hidden="true">✓</span>
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      className={`ai-card-btn ${pkg.highlight ? 'btn-primary' : 'btn-outline'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectAndPay(pkg.id);
                      }}
                    >
                      Chọn gói {pkg.priceDisplay}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="ai-pricing-new-user-box">
              <span>🎁 Bạn chưa có tài khoản? </span>
              <Link to="/register" onClick={onClose}>
                Đăng ký tài khoản ngay để nhận 2 lượt thử đồ AI miễn phí!
              </Link>
            </div>
          </>
        ) : (
          <div className="ai-checkout-panel">
            {purchaseSuccess ? (
              <div className="ai-checkout-success">
                <div className="success-icon" aria-hidden="true">🎉</div>
                <h3>Kích hoạt thành công!</h3>
                <p>
                  Bạn đã kích hoạt <strong>{purchaseSuccess.package.name}</strong> ({purchaseSuccess.package.priceDisplay}).
                </p>
                <div className="ai-success-details">
                  <span>Trạng thái: <b>Đang hoạt động</b></span>
                  <span>Phương thức: <b>{purchaseSuccess.record?.paymentMethod === 'payos' ? `Cổng thanh toán PayOS (STK: ${accountNumber} - ${bankName})` : 'Thanh toán trực tiếp'}</b></span>
                </div>
                <button
                  type="button"
                  className="tryon-btn-generate"
                  onClick={() => {
                    setIsCheckout(false);
                    setPurchaseSuccess(null);
                    onClose();
                  }}
                >
                  Bắt đầu thử đồ ngay
                </button>
              </div>
            ) : (
              <>
                <div className="ai-checkout-head">
                  <button
                    type="button"
                    className="ai-back-btn"
                    onClick={() => setIsCheckout(false)}
                  >
                    ← Quay lại chọn gói
                  </button>
                  <h3>Thanh toán gói AI qua PayOS</h3>
                </div>

                <div className="ai-checkout-summary">
                  <div className="ai-checkout-row">
                    <span>Gói đã chọn:</span>
                    <strong>{currentPkg.name}</strong>
                  </div>
                  <div className="ai-checkout-row">
                    <span>Thời hạn / Số lượt:</span>
                    <strong>{currentPkg.unit}</strong>
                  </div>
                  <div className="ai-checkout-row total">
                    <span>Tổng thanh toán:</span>
                    <span className="ai-price-total">{currentPkg.priceDisplay}</span>
                  </div>
                </div>

                <div className="ai-payment-options">
                  <div className="ai-qr-box">
                    <div>
                      <span className="payos-pill">Cổng thanh toán PayOS / VietQR</span>
                      <h4>Quét mã QR để thanh toán tự động</h4>
                    </div>
                    <div className="ai-qr-img-wrap">
                      <img
                        src={qrUrl}
                        alt="QR PayOS thanh toán gói AI"
                        width="180"
                        height="180"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`2|99|${accountNumber}|${accountHolder}||0|0|${currentPkg.price}|${transferContent}`)}`;
                        }}
                      />
                    </div>
                    <div className="ai-bank-info">
                      <div className="ai-bank-info-row">
                        <span>Ngân hàng:</span>
                        <b>{bankName}</b>
                      </div>
                      <div className="ai-bank-info-row">
                        <span>Số TK:</span>
                        <div className="copyable-val">
                          <b>{accountNumber}</b>
                          <button
                            type="button"
                            className="btn-copy-small"
                            onClick={() => copyText(accountNumber, 'stk')}
                          >
                            {copiedField === 'stk' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                      <div className="ai-bank-info-row">
                        <span>Chủ TK:</span>
                        <b>{accountHolder}</b>
                      </div>
                      <div className="ai-bank-info-row">
                        <span>Số tiền:</span>
                        <div className="copyable-val">
                          <b style={{ color: '#059669' }}>{currentPkg.priceDisplay}</b>
                          <button
                            type="button"
                            className="btn-copy-small"
                            onClick={() => copyText(String(currentPkg.price), 'amount')}
                          >
                            {copiedField === 'amount' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                      <div className="ai-bank-info-row">
                        <span>Nội dung CK:</span>
                        <div className="copyable-val">
                          <b>{transferContent}</b>
                          <button
                            type="button"
                            className="btn-copy-small"
                            onClick={() => copyText(transferContent, 'memo')}
                          >
                            {copiedField === 'memo' ? '✓ Đã chép' : 'Sao chép'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {payOsPaymentLink ? (
                      <div style={{ marginTop: '12px' }}>
                        <a
                          href={payOsPaymentLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-payos-link"
                          style={{
                            display: 'inline-block',
                            width: '100%',
                            textAlign: 'center',
                            padding: '10px 14px',
                            background: '#2563eb',
                            color: '#ffffff',
                            borderRadius: '8px',
                            fontWeight: '600',
                            textDecoration: 'none',
                            fontSize: '0.9rem',
                          }}
                        >
                          💳 Mở cổng thanh toán PayOS →
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="ai-checkout-actions">
                    <div className="ai-payos-instructions">
                      <strong>Hướng dẫn thanh toán PayOS:</strong>
                      <ol>
                        <li>Mở ứng dụng ngân hàng hoặc ví điện tử (MB, Momo, Vietcombank, v.v.).</li>
                        <li>Quét mã QR PayOS ở trên hoặc chuyển khoản đúng số TK <strong>{accountNumber}</strong> và nội dung.</li>
                        <li>Sau khi chuyển khoản thành công, nhấn nút xác nhận bên dưới để hệ thống kích hoạt gói ngay lập tức!</li>
                      </ol>
                    </div>

                    <button
                      type="button"
                      className="tryon-btn-generate"
                      disabled={isProcessing}
                      onClick={handlePayOsConfirm}
                    >
                      {isProcessing ? 'Đang kích hoạt...' : `✅ Xác nhận đã thanh toán PayOS (${currentPkg.priceDisplay})`}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
