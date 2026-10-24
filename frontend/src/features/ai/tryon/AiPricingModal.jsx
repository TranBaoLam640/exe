import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AI_PACKAGES, purchaseAiPackage } from './aiPackages.js';

export default function AiPricingModal({ isOpen, onClose, onPackagePurchased, initialSelectedPackageId }) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialSelectedPackageId || 'ai_day_pass');
  const [isCheckout, setIsCheckout] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);

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

  const bankName = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_BANK_NAME) || 'MBBank (Quân Đội)';
  const bankId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_BANK_ID) || 'MB';
  const accountNumber = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_ACCOUNT_NUMBER) || '9876543210';
  const accountHolder = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYOS_ACCOUNT_NAME) || 'NGUYEN DUC DUONG';
  const payOsPaymentLink = typeof import.meta !== 'undefined'
    ? (currentPkg.id === 'ai_single'
      ? import.meta.env?.VITE_PAYOS_LINK_1K
      : currentPkg.id === 'ai_day_pass'
      ? import.meta.env?.VITE_PAYOS_LINK_10K
      : import.meta.env?.VITE_PAYOS_LINK_50K) || ''
    : '';

  const transferContent = `DORENTME AI ${currentPkg.price / 1000}K`;
  const qrUrl = accountNumber && accountNumber !== '9876543210'
    ? `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${currentPkg.price}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accountHolder)}`
    : `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`2|99|${accountNumber}|${accountHolder}||0|0|${currentPkg.price}|${transferContent}`)}`;

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
                  <span>Phương thức: <b>Thanh toán nhanh</b></span>
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
                  <h3>Thanh toán gói AI</h3>
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
                    <h4>Quét mã QR thanh toán (VietQR / PayOS)</h4>
                    <div className="ai-qr-img-wrap">
                      <img
                        src={qrUrl}
                        alt="QR thanh toán gói AI"
                        width="180"
                        height="180"
                      />
                    </div>
                    <div className="ai-bank-info">
                      <div>Ngân hàng: <b>{bankName}</b></div>
                      <div>Số TK: <b>{accountNumber}</b></div>
                      <div>Chủ TK: <b>{accountHolder}</b></div>
                      <div>Nội dung: <b>{transferContent}</b></div>
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
                          Mở cổng thanh toán PayOS →
                        </a>
                      </div>
                    ) : null}
                  </div>

                  <div className="ai-checkout-actions">
                    <p className="ai-instant-hint">
                      💡 Bạn có thể bấm kích hoạt tức thì bên dưới để trải nghiệm ngay không cần chờ đối soát.
                    </p>
                    <button
                      type="button"
                      className="tryon-btn-generate"
                      disabled={isProcessing}
                      onClick={handleDirectActivate}
                    >
                      {isProcessing ? 'Đang kích hoạt...' : `Kích hoạt ngay (${currentPkg.priceDisplay})`}
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
