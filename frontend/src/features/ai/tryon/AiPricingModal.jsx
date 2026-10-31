import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AI_PACKAGES, getAiSubscription, purchaseAiPackage } from './aiPackages.js';
import {
  AI_PAYMENT_POLL_INTERVAL_MS,
  claimAiPackagePayment,
  clearPendingAiPayment,
  createAiPackagePayment,
  getAiPackagePaymentStatus,
  getReusablePendingAiPayment,
  savePendingAiPayment,
} from './aiPaymentService.js';
import { getApiErrorMessage } from '../../../utils/apiError.js';

const STATUS_LABELS = {
  creating: 'Đang tạo mã thanh toán PayOS...',
  pending: 'Đang chờ thanh toán — hệ thống sẽ tự kích hoạt gói ngay khi nhận được tiền.',
  activating: 'Đã nhận thanh toán, đang kích hoạt gói...',
  cancelled: 'Giao dịch đã bị hủy. Vui lòng tạo mã thanh toán mới.',
  expired: 'Mã thanh toán đã hết hạn. Vui lòng tạo mã thanh toán mới.',
};

function activateLocally(packageId, orderCode) {
  return purchaseAiPackage(packageId, 'payos', { orderCode });
}

function isActivatedLocally(orderCode) {
  const history = getAiSubscription().history;
  return Array.isArray(history) && history.some((record) => record.orderCode === String(orderCode));
}

export default function AiPricingModal({ isOpen, onClose, onPackagePurchased, initialSelectedPackageId, resumeOrderCode }) {
  const [selectedPkgId, setSelectedPkgId] = useState(initialSelectedPackageId || 'ai_day_pass');
  const [isCheckout, setIsCheckout] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(null);
  const [payment, setPayment] = useState(null);
  const [paymentState, setPaymentState] = useState('idle');
  const [paymentError, setPaymentError] = useState('');
  const activatingRef = useRef(false);
  const resumedRef = useRef(null);

  const currentPkg = AI_PACKAGES.find((p) => p.id === selectedPkgId) || AI_PACKAGES[1];

  const finishActivation = useCallback((result) => {
    clearPendingAiPayment();
    setPurchaseSuccess(result);
    setPaymentState('paid');
    if (onPackagePurchased) onPackagePurchased(result);
  }, [onPackagePurchased]);

  const activatePaidOrder = useCallback(async (paidPayment) => {
    if (activatingRef.current) return;
    activatingRef.current = true;
    setPaymentState('activating');
    try {
      await claimAiPackagePayment(paidPayment.orderCode);
      finishActivation(activateLocally(paidPayment.packageId, paidPayment.orderCode));
    } catch (error) {
      // Already claimed on this device (e.g. page reloaded right after activation).
      if (error?.response?.status === 409 && isActivatedLocally(paidPayment.orderCode)) {
        finishActivation(activateLocally(paidPayment.packageId, paidPayment.orderCode));
      } else {
        setPaymentState('error');
        setPaymentError(getApiErrorMessage(error, 'Không thể kích hoạt gói. Vui lòng liên hệ hỗ trợ kèm mã đơn.'));
      }
    } finally {
      activatingRef.current = false;
    }
  }, [finishActivation]);

  const applyStatus = useCallback((statusPayment) => {
    setPayment((current) => ({ ...current, ...statusPayment }));
    if (statusPayment.isPaid) {
      activatePaidOrder(statusPayment);
      return;
    }
    const status = String(statusPayment.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'EXPIRED') {
      clearPendingAiPayment();
      setPaymentState(status.toLowerCase());
    } else {
      setPaymentState('pending');
    }
  }, [activatePaidOrder]);

  const checkStatus = useCallback(async (orderCode) => {
    try {
      applyStatus(await getAiPackagePaymentStatus(orderCode));
    } catch (error) {
      if (error?.response?.status === 404) {
        clearPendingAiPayment();
        setPaymentState('error');
        setPaymentError('Không tìm thấy giao dịch. Vui lòng tạo mã thanh toán mới.');
      }
      // Other errors are transient; keep polling.
    }
  }, [applyStatus]);

  const startPayment = useCallback(async (pkgId) => {
    setPaymentError('');
    const reusable = getReusablePendingAiPayment(pkgId);
    if (reusable) {
      setPayment(reusable);
      setPaymentState('pending');
      checkStatus(reusable.orderCode);
      return;
    }

    setPayment(null);
    setPaymentState('creating');
    try {
      const created = await createAiPackagePayment(pkgId);
      savePendingAiPayment(created);
      setPayment(created);
      setPaymentState('pending');
    } catch (error) {
      setPaymentState('error');
      setPaymentError(getApiErrorMessage(error, 'Không thể tạo mã thanh toán PayOS. Vui lòng thử lại.'));
    }
  }, [checkStatus]);

  // Resume a payment after returning from the PayOS checkout page.
  useEffect(() => {
    if (!isOpen || !resumeOrderCode || resumedRef.current === resumeOrderCode) return;
    resumedRef.current = resumeOrderCode;
    setIsCheckout(true);
    setPurchaseSuccess(null);
    setPaymentState('pending');
    getAiPackagePaymentStatus(resumeOrderCode)
      .then((statusPayment) => {
        if (statusPayment?.packageId) setSelectedPkgId(statusPayment.packageId);
        setPayment(statusPayment);
        applyStatus(statusPayment);
      })
      .catch((error) => {
        setPaymentState('error');
        setPaymentError(getApiErrorMessage(error, 'Không thể kiểm tra giao dịch PayOS.'));
      });
  }, [isOpen, resumeOrderCode, applyStatus]);

  // Auto-poll PayOS status while the checkout is waiting for payment.
  useEffect(() => {
    if (!isOpen || !isCheckout || paymentState !== 'pending' || !payment?.orderCode) return undefined;
    const timer = window.setInterval(() => checkStatus(payment.orderCode), AI_PAYMENT_POLL_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [isOpen, isCheckout, paymentState, payment?.orderCode, checkStatus]);

  if (!isOpen) return null;

  const isBusy = paymentState === 'creating' || paymentState === 'activating';

  function handleSelectAndPay(pkgId) {
    setSelectedPkgId(pkgId);
    setIsCheckout(true);
    setPurchaseSuccess(null);
    startPayment(pkgId);
  }

  const qrImageUrl = payment?.qrCode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(payment.qrCode)}`
    : '';

  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isBusy) onClose();
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
                  <span>Phương thức: <b>Cổng thanh toán PayOS{purchaseSuccess.record?.orderCode ? ` (Mã đơn: ${purchaseSuccess.record.orderCode})` : ''}</b></span>
                </div>
                <button
                  type="button"
                  className="tryon-btn-generate"
                  onClick={() => {
                    setIsCheckout(false);
                    setPurchaseSuccess(null);
                    setPayment(null);
                    setPaymentState('idle');
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
                    disabled={isBusy}
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
                      {qrImageUrl ? (
                        <img src={qrImageUrl} alt="QR PayOS thanh toán gói AI" width="180" height="180" />
                      ) : (
                        <span>{paymentState === 'creating' ? 'Đang tạo mã QR...' : 'Chưa có mã QR'}</span>
                      )}
                    </div>
                    {payment?.orderCode ? (
                      <div className="ai-bank-info">
                        <div className="ai-bank-info-row">
                          <span>Mã đơn:</span>
                          <b>{payment.orderCode}</b>
                        </div>
                        <div className="ai-bank-info-row">
                          <span>Số tiền:</span>
                          <b style={{ color: '#059669' }}>{currentPkg.priceDisplay}</b>
                        </div>
                      </div>
                    ) : null}

                    {payment?.checkoutUrl ? (
                      <div style={{ marginTop: '12px' }}>
                        <a
                          href={payment.checkoutUrl}
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
                        <li>Quét mã QR PayOS ở trên hoặc mở cổng thanh toán PayOS.</li>
                        <li>Giữ nguyên cửa sổ này — gói sẽ được kích hoạt tự động ngay khi PayOS xác nhận đã nhận tiền.</li>
                      </ol>
                    </div>

                    <div className="ai-payment-status" role="status" aria-live="polite">
                      {paymentState === 'error' ? paymentError : STATUS_LABELS[paymentState] || ''}
                    </div>

                    {paymentState === 'pending' && payment?.orderCode ? (
                      <button
                        type="button"
                        className="tryon-btn-generate"
                        onClick={() => checkStatus(payment.orderCode)}
                      >
                        🔄 Kiểm tra trạng thái thanh toán
                      </button>
                    ) : null}

                    {['error', 'cancelled', 'expired'].includes(paymentState) ? (
                      <button
                        type="button"
                        className="tryon-btn-generate"
                        onClick={() => {
                          clearPendingAiPayment();
                          startPayment(currentPkg.id);
                        }}
                      >
                        Tạo mã thanh toán mới
                      </button>
                    ) : null}
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
