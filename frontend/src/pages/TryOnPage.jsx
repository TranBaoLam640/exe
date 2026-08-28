import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { createTryOn, getTryOnStatus } from '../features/ai/tryon/tryOnService.js';
import { getProviderGarmentUrl, resolveTryOnProduct } from '../features/ai/tryon/tryOnProduct.js';
import { isSupportedImageFile, resizeImageFile } from '../features/ai/tryon/imageProcessing.js';
import { MAX_TRIES_PER_SESSION, bumpTryOnCount, canUseTryOn } from '../features/ai/tryon/tryOnSession.js';
import { pollTryOnStatus } from '../features/ai/tryon/tryOnPolling.js';
import { addProductToCart } from '../features/cart/cartService.js';
import { getProducts } from '../features/catalog/services/catalogService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const initialStatus = { type: 'idle', message: '' };

function ProductPanel({ product }) {
  return (
    <section className="tryon-card">
      <h2>Sản phẩm bạn chọn</h2>
      {product ? (
        <>
          <div className="tryon-product-preview">
            <img src={imageUrl(product.image)} alt={product.name} />
            <div>
              <div className="tryon-product-name">{product.name}</div>
              <div className="tryon-product-category">{product.categoryLabel || product.category}</div>
            </div>
          </div>
          <Link to="/shop" className="tryon-change-product">→ Chọn sản phẩm khác</Link>
        </>
      ) : (
        <div className="tryon-no-product">
          <div className="tryon-no-product-icon" aria-hidden="true">?</div>
          <p>Chưa chọn sản phẩm nào để thử.<br />Vào Shop, mở 1 sản phẩm rồi bấm "Thử đồ AI".</p>
          <Link to="/shop">Đến Shop →</Link>
        </div>
      )}
    </section>
  );
}

function ResultPanel({ status, uploadedDataUrl, resultImageUrl, product, onRetry, onAddToCart, cartMessage }) {
  if (status.type === 'idle') return null;

  if (status.type === 'loading') {
    return (
      <section className="tryon-result-panel" aria-live="polite">
        <div className="tryon-loading-box">
          <div className="tryon-spinner" aria-hidden="true" />
          <div className="tryon-status-text">{status.message}</div>
          <div className="tryon-sub-text">Thường mất 20-60 giây, vui lòng đừng tắt trang.</div>
        </div>
      </section>
    );
  }

  if (status.type === 'error') {
    return (
      <section className="tryon-result-panel" aria-live="assertive">
        <div className="tryon-error-box">
          <div>{status.message}</div>
          <button type="button" onClick={onRetry} disabled={!product || !uploadedDataUrl}>
            Thử lại
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="tryon-result-panel">
      <div className="tryon-result-box">
        <h2>Kết quả thử đồ</h2>
        <div className="tryon-result-compare">
          <div className="tryon-result-col">
            <span>Ảnh của bạn</span>
            <img src={uploadedDataUrl} alt="Ảnh gốc của bạn" />
          </div>
          <div className="tryon-result-col">
            <span>Sau khi thử đồ</span>
            <img src={resultImageUrl} alt={`Kết quả thử đồ với ${product?.name || 'sản phẩm đã chọn'}`} />
          </div>
        </div>
        <div className="tryon-result-actions">
          <button className="tryon-btn-add-cart" type="button" onClick={onAddToCart} disabled={!product?.price3day}>
            {product?.price3day ? 'Thêm vào giỏ' : 'Không có thông tin giá'}
          </button>
          <a className="tryon-btn-download" href={resultImageUrl} download="dorentme-tryon.png" target="_blank" rel="noreferrer">
            Tải ảnh về
          </a>
          <button className="tryon-btn-retry" type="button" onClick={onRetry}>
            Thử lại
          </button>
        </div>
        {cartMessage ? <div className="tryon-cart-message" role="status">{cartMessage}</div> : null}
      </div>
    </section>
  );
}

export default function TryOnPage() {
  useDocumentTitle('Thử Đồ AI | DoRentMe');
  const location = useLocation();
  const catalog = useMemo(() => getProducts(), []);
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const { product } = useMemo(() => resolveTryOnProduct(params, catalog), [catalog, params]);
  const [uploadedDataUrl, setUploadedDataUrl] = useState('');
  const [resultImageUrl, setResultImageUrl] = useState('');
  const [status, setStatus] = useState(initialStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cartMessage, setCartMessage] = useState('');
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  useEffect(() => {
    if (status.type !== 'idle') {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [status]);

  async function handleFile(file) {
    setCartMessage('');
    setResultImageUrl('');
    if (!isSupportedImageFile(file)) {
      setStatus({ type: 'error', message: 'Vui lòng chọn 1 tệp ảnh.' });
      return;
    }

    try {
      const dataUrl = await resizeImageFile(file);
      setUploadedDataUrl(dataUrl);
      setStatus(initialStatus);
    } catch {
      setUploadedDataUrl('');
      setStatus({ type: 'error', message: 'Không xử lý được ảnh này. Vui lòng chọn ảnh khác.' });
    }
  }

  function resetPhoto() {
    abortRef.current?.abort();
    abortRef.current = null;
    setUploadedDataUrl('');
    setResultImageUrl('');
    setStatus(initialStatus);
    setCartMessage('');
    setIsSubmitting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function onDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('dragover');
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  async function startTryOn() {
    if (!product || !uploadedDataUrl || isSubmitting) return;

    if (!canUseTryOn()) {
      setStatus({ type: 'error', message: `Bạn đã thử tối đa ${MAX_TRIES_PER_SESSION} lần trong phiên này. Vui lòng mở phiên mới để tiếp tục.` });
      return;
    }

    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setIsSubmitting(true);
    setCartMessage('');
    setResultImageUrl('');
    setStatus({ type: 'loading', message: 'Đang gửi yêu cầu...' });

    try {
      const garmentImageUrl = getProviderGarmentUrl(product, imageUrl);
      const { requestId } = await createTryOn(
        {
          humanImage: uploadedDataUrl,
          garmentImageUrl,
        },
        { signal: controller.signal },
      );

      bumpTryOnCount();
      const result = await pollTryOnStatus(requestId, {
        getStatus: getTryOnStatus,
        signal: controller.signal,
        onProgress: (message) => setStatus({ type: 'loading', message }),
      });
      setResultImageUrl(result.resultImageUrl);
      setStatus({ type: 'success', message: '' });
    } catch (error) {
      if (error?.name !== 'AbortError') {
        setStatus({ type: 'error', message: error?.message || 'Có lỗi xảy ra, vui lòng thử lại.' });
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsSubmitting(false);
    }
  }

  function addResultProductToCart() {
    if (!product) return;
    addProductToCart(product, 1);
    setCartMessage('Đã thêm sản phẩm vào giỏ hàng.');
  }

  const canGenerate = Boolean(product && uploadedDataUrl && !isSubmitting);

  return (
    <div className="tryon-page">
      <section className="tryon-mini-hero">
        <span className="tryon-badge">AI thử đồ</span>
        <h1>Thử Đồ <span>Bằng AI</span> Trước Khi Thuê</h1>
        <p>Tải lên 1 tấm ảnh của bạn, AI sẽ ghép thử trang phục lên người để xem trước khi đặt thuê.</p>
      </section>

      <div className="tryon-body">
        <div className="tryon-layout">
          <ProductPanel product={product} />

          <section className="tryon-card">
            <h2>Ảnh của bạn</h2>
            {!uploadedDataUrl ? (
              <div
                className="tryon-upload-zone"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add('dragover');
                }}
                onDragLeave={(event) => event.currentTarget.classList.remove('dragover')}
                onDrop={onDrop}
              >
                <div className="tryon-upload-icon" aria-hidden="true">↑</div>
                <p>Kéo thả ảnh vào đây hoặc bấm để chọn<br /><span>Nên là ảnh đứng thẳng, nhìn thẳng, rõ dáng</span></p>
                <label className="sr-only" htmlFor="tryon-file-input">Chọn ảnh của bạn</label>
                <input
                  id="tryon-file-input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
              </div>
            ) : (
              <div className="tryon-upload-preview">
                <img src={uploadedDataUrl} alt="Ảnh của bạn" />
                <button className="tryon-change-photo" type="button" onClick={resetPhoto}>
                  Đổi ảnh khác
                </button>
              </div>
            )}
            <button className="tryon-btn-generate" type="button" onClick={startTryOn} disabled={!canGenerate}>
              Thử đồ ngay
            </button>
            <p className="tryon-hint">Mỗi lần thử mất khoảng 20-60 giây và tốn một khoản phí xử lý AI nhỏ, vui lòng thử vừa đủ nhu cầu.</p>
          </section>
        </div>

        <div ref={resultRef}>
          <ResultPanel
            status={status}
            uploadedDataUrl={uploadedDataUrl}
            resultImageUrl={resultImageUrl}
            product={product}
            onRetry={startTryOn}
            onAddToCart={addResultProductToCart}
            cartMessage={cartMessage}
          />
        </div>
      </div>
    </div>
  );
}
