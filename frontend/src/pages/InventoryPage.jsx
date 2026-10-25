import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { useAuthState } from '../features/auth/useAuthState.js';
import { fetchProducts } from '../features/catalog/services/catalogService.js';
import {
  createInventory,
  deleteInventory,
  getInventory,
  getProductAvailability,
  INVENTORY_CONDITIONS,
  INVENTORY_STATUSES,
  inventoryErrorMessage,
  updateInventory,
  updateInventoryStatus,
} from '../features/inventory/inventoryService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const blankForm = {
  productId: '',
  variantId: '',
  assetCode: '',
  condition: 'GOOD',
  notes: '',
  acquiredAt: '',
};

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('vi-VN');
}

function variantLabel(variant = {}) {
  return [variant.size, variant.color, variant.variantCode].filter(Boolean).join(' / ') || `Variant #${variant.id}`;
}

function apiDate(value) {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export default function InventoryPage() {
  useDocumentTitle('Quản Lý Kho Hàng | DoRentMe');
  const session = useAuthState();
  const [items, setItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({ productId: '', variantId: '', status: '', condition: '' });
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [nextStatus, setNextStatus] = useState('AVAILABLE');
  const [availability, setAvailability] = useState({
    productId: '',
    startDate: '',
    endDate: '',
    loading: false,
    error: '',
    result: null,
  });

  const selectedFilterProduct = useMemo(
    () => products.find((product) => String(product.id) === String(filters.productId)),
    [filters.productId, products],
  );

  const selectedFormProduct = useMemo(
    () => products.find((product) => String(product.id) === String(form.productId)),
    [form.productId, products],
  );

  useEffect(() => {
    let cancelled = false;
    setProductsLoading(true);

    fetchProducts({ pageSize: 100 })
      .then((page) => {
        if (!cancelled) setProducts(page.items || []);
      })
      .catch((requestError) => {
        if (!cancelled) setError(inventoryErrorMessage(requestError, 'Không thể tải danh sách sản phẩm cho kho hàng.'));
      })
      .finally(() => {
        if (!cancelled) setProductsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadInventory();
  }, [filters.productId, filters.variantId, filters.status, filters.condition]);

  async function loadInventory() {
    setLoading(true);
    setError('');

    try {
      const data = await getInventory(filters);
      setItems(data);
    } catch (requestError) {
      setError(inventoryErrorMessage(requestError, 'Không thể tải dữ liệu kho hàng.'));
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(name, value) {
    setFilters((current) => ({
      ...current,
      [name]: value,
      ...(name === 'productId' ? { variantId: '' } : {}),
    }));
  }

  function openCreateForm() {
    setFormMode('create');
    setForm(blankForm);
    setFormError('');
  }

  function openEditForm(item) {
    setFormMode('edit');
    setForm({
      id: item.id,
      productId: item.productId,
      variantId: item.productVariantId,
      assetCode: item.assetCode || '',
      condition: item.condition || 'GOOD',
      notes: item.notes || '',
      acquiredAt: apiDate(item.acquiredAt),
    });
    setFormError('');
  }

  function closeForm() {
    if (submitting) return;
    setFormMode(null);
    setForm(blankForm);
    setFormError('');
  }

  function updateForm(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'productId' ? { variantId: '' } : {}),
    }));
  }

  async function submitForm(event) {
    event.preventDefault();
    const trimmedAssetCode = form.assetCode.trim();

    if (!trimmedAssetCode) {
      setFormError('Vui lòng nhập Mã tài sản.');
      return;
    }

    if (trimmedAssetCode.length > 100) {
      setFormError('Mã tài sản không được vượt quá 100 ký tự.');
      return;
    }

    if ((form.notes || '').length > 500) {
      setFormError('Ghi chú không được vượt quá 500 ký tự.');
      return;
    }

    if (formMode === 'create' && (!form.productId || !form.variantId)) {
      setFormError('Vui lòng chọn sản phẩm và phân loại trước khi thêm vào kho.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (formMode === 'create') {
        await createInventory(form.productId, form.variantId, form);
        setMessage('Đã thêm món đồ mới vào kho với trạng thái SẴN SÀNG.');
      } else {
        await updateInventory(form.id, form);
        setMessage('Đã cập nhật món đồ trong kho.');
      }

      setFormMode(null);
      setForm(blankForm);
      setFormError('');
      await loadInventory();
    } catch (requestError) {
      setFormError(inventoryErrorMessage(requestError, 'Không thể lưu món đồ trong kho.'));
    } finally {
      setSubmitting(false);
    }
  }

  function openStatusDialog(item) {
    setStatusTarget(item);
    setNextStatus(item.status || 'AVAILABLE');
    setMessage('');
  }

  async function submitStatus(event) {
    event.preventDefault();
    if (!statusTarget) return;

    setSubmitting(true);
    setError('');

    try {
      await updateInventoryStatus(statusTarget.id, nextStatus);
      setMessage(`Đã cập nhật trạng thái thành ${nextStatus}.`);
      setStatusTarget(null);
      await loadInventory();
    } catch (requestError) {
      setError(inventoryErrorMessage(requestError, 'Không thể cập nhật trạng thái kho hàng.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Xoá món đồ ${item.assetCode}? Hành động này không thể hoàn tác.`)) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await deleteInventory(item.id);
      setMessage('Đã xoá món đồ khỏi kho.');
      await loadInventory();
    } catch (requestError) {
      setError(inventoryErrorMessage(requestError, 'Không thể xoá món đồ khỏi kho.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function checkAvailability(event) {
    event.preventDefault();
    if (!availability.productId || !availability.startDate || !availability.endDate) {
      setAvailability((current) => ({ ...current, error: 'Vui lòng chọn sản phẩm, ngày bắt đầu và ngày kết thúc.' }));
      return;
    }

    setAvailability((current) => ({ ...current, loading: true, error: '', result: null }));

    try {
      const result = await getProductAvailability(availability.productId, availability.startDate, availability.endDate);
      setAvailability((current) => ({ ...current, loading: false, result }));
    } catch (requestError) {
      setAvailability((current) => ({
        ...current,
        loading: false,
        error: inventoryErrorMessage(requestError, 'Không thể kiểm tra lịch trống của sản phẩm.'),
      }));
    }
  }

  return (
    <div className="admin-page inventory-page">
      <header className="admin-header">
        <div className="admin-brand">
          <Link to="/" title="Về trang chủ DoRentMe">
            <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          </Link>
          <h1>Quản Lý Kho Hàng</h1>
        </div>
        {String(session?.role || '').toUpperCase() === 'ADMIN' ? (
          <div className="admin-nav-tabs">
            <Link to="/admin" className="admin-tab-btn">
              📦 Quản lý Đơn hàng
            </Link>
            <Link to="/admin/analytics" className="admin-tab-btn">
              📊 Thống kê Lượt truy cập & GA
            </Link>
            <Link to="/admin/inventory" className="admin-tab-btn active">
              👗 Quản lý Kho hàng
            </Link>
            <Link to="/shipper" className="admin-tab-btn">
              🚚 Giám sát Giao hàng
            </Link>
          </div>
        ) : null}
        <div className="inventory-admin-links">
          <Link to="/">🌐 Xem Website</Link>
          <span>{session?.role === 'ADMIN' ? 'Quản trị viên' : session?.role === 'LENDER' ? 'Chủ shop' : session?.role || 'Quản trị viên'}</span>
        </div>
      </header>

      <main className="admin-body inventory-body">
        <div className="inventory-heading">
          <div>
            {String(session?.role || '').toUpperCase() === 'ADMIN' ? (
              <Link className="inventory-back-link" to="/admin">Đơn hàng quản trị</Link>
            ) : null}
            <h2>Tài sản trang phục trong kho</h2>
            <p>Quản lý từng món đồ thực tế cho thuê. Món đồ mới thêm sẽ có trạng thái SẴN SÀNG.</p>
          </div>
          <button className="inventory-primary-btn" type="button" onClick={openCreateForm}>
            + Thêm đồ vào kho
          </button>
        </div>

        {message ? <div className="inventory-message success">{message}</div> : null}
        {error ? <div className="inventory-message error">{error}</div> : null}

        <section className="inventory-panel" aria-label="Bộ lọc kho hàng">
          <div className="inventory-filter-grid">
            <label>
              <span>Sản phẩm</span>
              <select
                value={filters.productId}
                onChange={(event) => updateFilter('productId', event.target.value)}
                disabled={productsLoading}
              >
                <option value="">Tất cả sản phẩm</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Phân loại</span>
              <select
                value={filters.variantId}
                onChange={(event) => updateFilter('variantId', event.target.value)}
                disabled={!selectedFilterProduct}
              >
                <option value="">Tất cả phân loại</option>
                {(selectedFilterProduct?.variants || []).map((variant) => (
                  <option key={variant.id} value={variant.id}>{variantLabel(variant)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Trạng thái</span>
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option value="">Tất cả trạng thái</option>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Tình trạng</span>
              <select value={filters.condition} onChange={(event) => updateFilter('condition', event.target.value)}>
                <option value="">Tất cả tình trạng</option>
                {INVENTORY_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="inventory-panel" aria-label="Bảng kho hàng">
          {loading ? (
            <div className="admin-empty">Đang tải kho hàng...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">Không có món đồ nào khớp với bộ lọc.</div>
          ) : (
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Mã tài sản</th>
                    <th>Sản phẩm</th>
                    <th>Phân loại</th>
                    <th>Tình trạng</th>
                    <th>Trạng thái</th>
                    <th>Ngày nhập</th>
                    <th>Cập nhật</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.assetCode}</strong></td>
                      <td>{item.productName || `Sản phẩm #${item.productId}`}</td>
                      <td>{[item.size, item.color, item.variantCode].filter(Boolean).join(' / ') || `Phân loại #${item.productVariantId}`}</td>
                      <td><span className="inventory-chip condition">{item.condition}</span></td>
                      <td><span className={`inventory-chip status ${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                      <td>{formatDate(item.acquiredAt)}</td>
                      <td>{formatDate(item.updatedAt)}</td>
                      <td>
                        <div className="inventory-actions">
                          <button type="button" onClick={() => openEditForm(item)}>Sửa</button>
                          <button type="button" onClick={() => openStatusDialog(item)}>Trạng thái</button>
                          <button className="danger" type="button" onClick={() => removeItem(item)} disabled={submitting}>Xóa</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="inventory-panel" aria-label="Kiểm tra lịch trống">
          <div className="inventory-section-title">
            <h3>Kiểm tra lịch trống của sản phẩm</h3>
          </div>
          <form className="inventory-filter-grid availability-form" onSubmit={checkAvailability}>
            <label>
              <span>Sản phẩm</span>
              <select
                value={availability.productId}
                onChange={(event) => setAvailability((current) => ({ ...current, productId: event.target.value }))}
              >
                <option value="">Chọn sản phẩm</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Ngày bắt đầu</span>
              <input
                type="date"
                value={availability.startDate}
                onChange={(event) => setAvailability((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label>
              <span>Ngày kết thúc</span>
              <input
                type="date"
                value={availability.endDate}
                onChange={(event) => setAvailability((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <button className="inventory-secondary-btn" type="submit" disabled={availability.loading}>
              {availability.loading ? 'Đang kiểm tra...' : 'Kiểm tra lịch trống'}
            </button>
          </form>
          {availability.error ? <div className="inventory-message error">{availability.error}</div> : null}
          {availability.result ? (
            <div className="availability-results">
              {(availability.result.variants || []).map((variant) => (
                <div className="availability-row" key={variant.variantId}>
                  <div>
                    <strong>{[variant.size, variant.color, variant.variantCode].filter(Boolean).join(' / ') || `Phân loại #${variant.variantId}`}</strong>
                    <span>{variant.totalInventory} tổng số</span>
                  </div>
                  <span className={`inventory-chip status ${variant.isAvailable ? 'available' : 'retired'}`}>
                    {variant.availableInventory} sẵn sàng cho thuê
                  </span>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </main>

      {formMode ? (
        <div className="inventory-modal-backdrop" role="presentation">
          <form className="inventory-modal" onSubmit={submitForm}>
            <div className="inventory-modal-head">
              <h3>{formMode === 'create' ? 'Thêm món đồ vào kho' : 'Chỉnh sửa món đồ trong kho'}</h3>
              <button aria-label="Đóng" type="button" onClick={closeForm}>✕</button>
            </div>
            {formMode === 'create' ? (
              <>
                <label>
                  <span>Sản phẩm</span>
                  <select value={form.productId} onChange={(event) => updateForm('productId', event.target.value)}>
                    <option value="">Chọn sản phẩm</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Phân loại</span>
                  <select value={form.variantId} onChange={(event) => updateForm('variantId', event.target.value)} disabled={!selectedFormProduct}>
                    <option value="">Chọn phân loại</option>
                    {(selectedFormProduct?.variants || []).map((variant) => (
                      <option key={variant.id} value={variant.id}>{variantLabel(variant)}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <label>
              <span>Mã tài sản</span>
              <input maxLength={100} value={form.assetCode} onChange={(event) => updateForm('assetCode', event.target.value)} />
            </label>
            <label>
              <span>Tình trạng</span>
              <select value={form.condition} onChange={(event) => updateForm('condition', event.target.value)}>
                {INVENTORY_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Ngày nhập</span>
              <input type="date" value={form.acquiredAt} onChange={(event) => updateForm('acquiredAt', event.target.value)} />
            </label>
            <label>
              <span>Ghi chú</span>
              <textarea maxLength={500} rows={4} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
            </label>
            {formError ? <div className="inventory-message error">{formError}</div> : null}
            <div className="inventory-modal-actions">
              <button type="button" onClick={closeForm} disabled={submitting}>Hủy bỏ</button>
              <button className="inventory-primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu lại'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {statusTarget ? (
        <div className="inventory-modal-backdrop" role="presentation">
          <form className="inventory-modal compact" onSubmit={submitStatus}>
            <div className="inventory-modal-head">
              <h3>Cập nhật trạng thái</h3>
              <button aria-label="Đóng" type="button" onClick={() => setStatusTarget(null)}>✕</button>
            </div>
            <p className="inventory-modal-copy">
              {statusTarget.assetCode}: tình trạng hiện tại là {statusTarget.condition}. Thao tác này chỉ cập nhật trạng thái vận hành.
            </p>
            <label>
              <span>Trạng thái</span>
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="inventory-modal-actions">
              <button type="button" onClick={() => setStatusTarget(null)} disabled={submitting}>Hủy bỏ</button>
              <button className="inventory-primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Đang cập nhật...' : 'Cập nhật trạng thái'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
