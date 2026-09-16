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
  useDocumentTitle('Inventory Management | DoRentMe');
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
        if (!cancelled) setError(inventoryErrorMessage(requestError, 'Unable to load products for inventory.'));
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
      setError(inventoryErrorMessage(requestError, 'Unable to load inventory.'));
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
      setFormError('Asset Code is required.');
      return;
    }

    if (trimmedAssetCode.length > 100) {
      setFormError('Asset Code must be 100 characters or less.');
      return;
    }

    if ((form.notes || '').length > 500) {
      setFormError('Notes must be 500 characters or less.');
      return;
    }

    if (formMode === 'create' && (!form.productId || !form.variantId)) {
      setFormError('Choose a product and variant before adding inventory.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      if (formMode === 'create') {
        await createInventory(form.productId, form.variantId, form);
        setMessage('Inventory item created as AVAILABLE.');
      } else {
        await updateInventory(form.id, form);
        setMessage('Inventory item updated.');
      }

      setFormMode(null);
      setForm(blankForm);
      setFormError('');
      await loadInventory();
    } catch (requestError) {
      setFormError(inventoryErrorMessage(requestError, 'Unable to save inventory item.'));
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
      setMessage(`Status updated to ${nextStatus}.`);
      setStatusTarget(null);
      await loadInventory();
    } catch (requestError) {
      setError(inventoryErrorMessage(requestError, 'Unable to update inventory status.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function removeItem(item) {
    if (!window.confirm(`Delete inventory item ${item.assetCode}? This cannot be undone.`)) return;

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await deleteInventory(item.id);
      setMessage('Inventory item deleted.');
      await loadInventory();
    } catch (requestError) {
      setError(inventoryErrorMessage(requestError, 'Unable to delete inventory item.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function checkAvailability(event) {
    event.preventDefault();
    if (!availability.productId || !availability.startDate || !availability.endDate) {
      setAvailability((current) => ({ ...current, error: 'Choose product, start date, and end date.' }));
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
        error: inventoryErrorMessage(requestError, 'Unable to check availability.'),
      }));
    }
  }

  return (
    <div className="admin-page inventory-page">
      <header className="admin-header">
        <div className="admin-brand">
          <img alt="DoRentMe" src={imageUrl('Logo.png')} />
          <h1>Inventory Management</h1>
        </div>
        <span>{session?.role || 'MANAGER'}</span>
      </header>

      <main className="admin-body inventory-body">
        <div className="inventory-heading">
          <div>
            {String(session?.role || '').toUpperCase() === 'ADMIN' ? (
              <Link className="inventory-back-link" to="/admin">Admin orders</Link>
            ) : null}
            <h2>Physical rental assets</h2>
            <p>Manage individual inventory items. New items are created with AVAILABLE status.</p>
          </div>
          <button className="inventory-primary-btn" type="button" onClick={openCreateForm}>
            Add Inventory
          </button>
        </div>

        {message ? <div className="inventory-message success">{message}</div> : null}
        {error ? <div className="inventory-message error">{error}</div> : null}

        <section className="inventory-panel" aria-label="Inventory filters">
          <div className="inventory-filter-grid">
            <label>
              <span>Product</span>
              <select
                value={filters.productId}
                onChange={(event) => updateFilter('productId', event.target.value)}
                disabled={productsLoading}
              >
                <option value="">All products</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Variant</span>
              <select
                value={filters.variantId}
                onChange={(event) => updateFilter('variantId', event.target.value)}
                disabled={!selectedFilterProduct}
              >
                <option value="">All variants</option>
                {(selectedFilterProduct?.variants || []).map((variant) => (
                  <option key={variant.id} value={variant.id}>{variantLabel(variant)}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Status</span>
              <select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)}>
                <option value="">All statuses</option>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Condition</span>
              <select value={filters.condition} onChange={(event) => updateFilter('condition', event.target.value)}>
                <option value="">All conditions</option>
                {INVENTORY_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="inventory-panel" aria-label="Inventory table">
          {loading ? (
            <div className="admin-empty">Loading inventory...</div>
          ) : items.length === 0 ? (
            <div className="admin-empty">No inventory items match the current filters.</div>
          ) : (
            <div className="inventory-table-wrap">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Asset Code</th>
                    <th>Product</th>
                    <th>Variant</th>
                    <th>Condition</th>
                    <th>Status</th>
                    <th>Acquired</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td><strong>{item.assetCode}</strong></td>
                      <td>{item.productName || `Product #${item.productId}`}</td>
                      <td>{[item.size, item.color, item.variantCode].filter(Boolean).join(' / ') || `Variant #${item.productVariantId}`}</td>
                      <td><span className="inventory-chip condition">{item.condition}</span></td>
                      <td><span className={`inventory-chip status ${String(item.status || '').toLowerCase()}`}>{item.status}</span></td>
                      <td>{formatDate(item.acquiredAt)}</td>
                      <td>{formatDate(item.updatedAt)}</td>
                      <td>
                        <div className="inventory-actions">
                          <button type="button" onClick={() => openEditForm(item)}>Edit</button>
                          <button type="button" onClick={() => openStatusDialog(item)}>Status</button>
                          <button className="danger" type="button" onClick={() => removeItem(item)} disabled={submitting}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="inventory-panel" aria-label="Availability check">
          <div className="inventory-section-title">
            <h3>Check product availability</h3>
          </div>
          <form className="inventory-filter-grid availability-form" onSubmit={checkAvailability}>
            <label>
              <span>Product</span>
              <select
                value={availability.productId}
                onChange={(event) => setAvailability((current) => ({ ...current, productId: event.target.value }))}
              >
                <option value="">Choose product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Start date</span>
              <input
                type="date"
                value={availability.startDate}
                onChange={(event) => setAvailability((current) => ({ ...current, startDate: event.target.value }))}
              />
            </label>
            <label>
              <span>End date</span>
              <input
                type="date"
                value={availability.endDate}
                onChange={(event) => setAvailability((current) => ({ ...current, endDate: event.target.value }))}
              />
            </label>
            <button className="inventory-secondary-btn" type="submit" disabled={availability.loading}>
              {availability.loading ? 'Checking...' : 'Check Availability'}
            </button>
          </form>
          {availability.error ? <div className="inventory-message error">{availability.error}</div> : null}
          {availability.result ? (
            <div className="availability-results">
              {(availability.result.variants || []).map((variant) => (
                <div className="availability-row" key={variant.variantId}>
                  <div>
                    <strong>{[variant.size, variant.color, variant.variantCode].filter(Boolean).join(' / ') || `Variant #${variant.variantId}`}</strong>
                    <span>{variant.totalInventory} total</span>
                  </div>
                  <span className={`inventory-chip status ${variant.isAvailable ? 'available' : 'retired'}`}>
                    {variant.availableInventory} available
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
              <h3>{formMode === 'create' ? 'Add Inventory Item' : 'Edit Inventory Item'}</h3>
              <button aria-label="Close" type="button" onClick={closeForm}>x</button>
            </div>
            {formMode === 'create' ? (
              <>
                <label>
                  <span>Product</span>
                  <select value={form.productId} onChange={(event) => updateForm('productId', event.target.value)}>
                    <option value="">Choose product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Variant</span>
                  <select value={form.variantId} onChange={(event) => updateForm('variantId', event.target.value)} disabled={!selectedFormProduct}>
                    <option value="">Choose variant</option>
                    {(selectedFormProduct?.variants || []).map((variant) => (
                      <option key={variant.id} value={variant.id}>{variantLabel(variant)}</option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
            <label>
              <span>Asset Code</span>
              <input maxLength={100} value={form.assetCode} onChange={(event) => updateForm('assetCode', event.target.value)} />
            </label>
            <label>
              <span>Condition</span>
              <select value={form.condition} onChange={(event) => updateForm('condition', event.target.value)}>
                {INVENTORY_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>{condition}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Acquired At</span>
              <input type="date" value={form.acquiredAt} onChange={(event) => updateForm('acquiredAt', event.target.value)} />
            </label>
            <label>
              <span>Notes</span>
              <textarea maxLength={500} rows={4} value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} />
            </label>
            {formError ? <div className="inventory-message error">{formError}</div> : null}
            <div className="inventory-modal-actions">
              <button type="button" onClick={closeForm} disabled={submitting}>Cancel</button>
              <button className="inventory-primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {statusTarget ? (
        <div className="inventory-modal-backdrop" role="presentation">
          <form className="inventory-modal compact" onSubmit={submitStatus}>
            <div className="inventory-modal-head">
              <h3>Update Status</h3>
              <button aria-label="Close" type="button" onClick={() => setStatusTarget(null)}>x</button>
            </div>
            <p className="inventory-modal-copy">
              {statusTarget.assetCode}: condition remains {statusTarget.condition}. Only the operational status changes.
            </p>
            <label>
              <span>Status</span>
              <select value={nextStatus} onChange={(event) => setNextStatus(event.target.value)}>
                {INVENTORY_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
            <div className="inventory-modal-actions">
              <button type="button" onClick={() => setStatusTarget(null)} disabled={submitting}>Cancel</button>
              <button className="inventory-primary-btn" type="submit" disabled={submitting}>
                {submitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
