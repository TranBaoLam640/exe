import { dispatchAppEvent, getBrowserStorage, readArrayValue, writeJsonValue } from '../../utils/browserStorage.js';
import api from '../../config/api.js';

export const CART_KEY = 'dorentme_cart';
export const CART_CHANGED_EVENT = 'cart:changed';
const SESSION_KEY = 'dorentme_session';
const DEFAULT_RENTAL_DAYS = 3;

export function parsePrice(value) {
  if (!value) return 0;
  const digits = String(value).replace(/[^\d]/g, '');
  return Number.parseInt(digits, 10) || 0;
}

export function formatVnd(value) {
  return `${(value || 0).toLocaleString('vi-VN')} vnd`;
}

export function getCart(storage = getBrowserStorage()) {
  return readArrayValue(storage, CART_KEY);
}

export function saveCart(cart, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);

  writeJsonValue(storage, CART_KEY, cart);
  dispatchAppEvent(eventTarget, CART_CHANGED_EVENT, cart);
  return cart;
}

export function countCartItems(cart = getCart()) {
  return cart.reduce((sum, item) => sum + (Number(item?.qty) || 1), 0);
}

export function getCartTotals(cart = getCart()) {
  return cart.reduce(
    (totals, item) => {
      const qty = Number(item?.qty ?? item?.quantity) || 1;
      totals.qty += qty;
      totals.rent += Number(item?.lineSubtotal) || (parsePrice(item?.price3day) * qty);
      totals.deposit += Number(item?.deposit) || (parsePrice(item?.priceDeposit) * qty);
      totals.total = totals.rent + totals.deposit;
      return totals;
    },
    { qty: 0, rent: 0, deposit: 0, total: 0 },
  );
}

export function toLegacyCartItem(product, quantity) {
  const item = {
    name: product.name,
    image: product.image || '',
    category: product.category || product.categoryLabel || '',
    price3day: product.price3day || '',
    price1day: product.price1day || '',
    priceTag: product.priceTag || '',
    priceDeposit: product.priceDeposit || '',
    priceExtra: product.priceExtra || '',
    qty: quantity,
  };
  const variant = selectDefaultVariant(product);
  if (product.id && variant?.id) {
    item.productId = product.id;
    item.productVariantId = variant.id;
    item.rentalStartDate = defaultRentalStartDate();
    item.rentalEndDate = defaultRentalEndDate();
  }
  return item;
}

export function addProductToCart(product, quantity = 1, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const cart = getCart(storage);
  const existing = cart.find((item) => item.name === product.name);

  if (existing) {
    existing.qty = (Number(existing.qty) || 1) + qty;
  } else {
    cart.push(toLegacyCartItem(product, qty));
  }

  return saveCart(cart, options);
}

export function removeCartItem(name, options = {}) {
  const storage = options.storage || getBrowserStorage();
  return saveCart(getCart(storage).filter((item) => item.name !== name), options);
}

export function setCartItemQty(name, quantity, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const cart = getCart(storage);
  const item = cart.find((candidate) => candidate.name === name);

  if (item) {
    item.qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  }

  return saveCart(cart, options);
}

export function decrementCartItem(name, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const item = getCart(storage).find((candidate) => candidate.name === name);
  if (!item) return getCart(storage);
  if ((Number(item.qty) || 1) <= 1) return removeCartItem(name, options);
  return setCartItemQty(name, (Number(item.qty) || 1) - 1, options);
}

export function clearCart(options = {}) {
  return saveCart([], options);
}

export function hasServerSession(storage = getBrowserStorage()) {
  return Boolean(readSession(storage)?.token);
}

export async function getActiveCartState(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) {
    const items = getCart(storage);
    return { source: 'guest', cart: null, items, totals: getCartTotals(items), count: countCartItems(items) };
  }

  const cart = await fetchServerCart();
  const items = mapServerCartItems(cart);
  return { source: 'server', cart, items, totals: serverTotals(cart), count: cart.itemCount || 0 };
}

export async function addProductToActiveCart(product, quantity = 1, options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) {
    return { source: 'guest', cart: addProductToCart(product, quantity, options) };
  }

  const variant = selectDefaultVariant(product);
  if (!variant?.id) {
    throw new Error('Sản phẩm chưa có biến thể khả dụng để thêm vào giỏ.');
  }

  const cart = await addServerCartItem({
    productVariantId: variant.id,
    quantity,
    rentalStartDate: defaultRentalStartDate(),
    rentalEndDate: defaultRentalEndDate(),
  });
  dispatchCartChanged(cart);
  return { source: 'server', cart };
}

export async function setActiveCartItemQty(item, quantity) {
  if (!item?.serverItem) return setCartItemQty(item.name, quantity);
  const cart = await updateServerCartItem(item.id, {
    quantity,
    rentalStartDate: item.rentalStartDate,
    rentalEndDate: item.rentalEndDate,
  });
  dispatchCartChanged(cart);
  return cart;
}

export async function decrementActiveCartItem(item) {
  const qty = Number(item?.qty ?? item?.quantity) || 1;
  if (qty <= 1) return removeActiveCartItem(item);
  return setActiveCartItemQty(item, qty - 1);
}

export async function removeActiveCartItem(item) {
  if (!item?.serverItem) return removeCartItem(item.name);
  const cart = await removeServerCartItem(item.id);
  dispatchCartChanged(cart);
  return cart;
}

export async function clearActiveCart(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) return clearCart(options);
  const cart = await clearServerCart();
  dispatchCartChanged(cart);
  return cart;
}

export async function syncGuestCartToServer(options = {}) {
  const storage = options.storage || getBrowserStorage();
  if (!hasServerSession(storage)) return { migrated: 0, failed: [] };

  const guestItems = getCart(storage);
  const migratedNames = new Set();
  const failed = [];

  for (const item of guestItems) {
    if (!item.productVariantId) {
      failed.push({ item, reason: 'missing_variant' });
      continue;
    }

    try {
      await addServerCartItem({
        productVariantId: item.productVariantId,
        quantity: Number(item.qty) || 1,
        rentalStartDate: item.rentalStartDate || defaultRentalStartDate(),
        rentalEndDate: item.rentalEndDate || defaultRentalEndDate(),
      });
      migratedNames.add(item.name);
    } catch (error) {
      failed.push({ item, reason: error.response?.data?.error?.message || error.message });
    }
  }

  if (migratedNames.size > 0) {
    saveCart(guestItems.filter((item) => !migratedNames.has(item.name)), options);
  }

  const cart = await fetchServerCart();
  dispatchCartChanged(cart);
  return { migrated: migratedNames.size, failed, cart };
}

export async function fetchServerCart() {
  const response = await api.get('/api/cart');
  return response.data?.data;
}

export async function addServerCartItem(payload) {
  const response = await api.post('/api/cart/items', payload);
  return response.data?.data;
}

export async function updateServerCartItem(itemId, payload) {
  const response = await api.put(`/api/cart/items/${itemId}`, payload);
  return response.data?.data;
}

export async function removeServerCartItem(itemId) {
  const response = await api.delete(`/api/cart/items/${itemId}`);
  return response.data?.data;
}

export async function clearServerCart() {
  const response = await api.delete('/api/cart');
  return response.data?.data;
}

function mapServerCartItems(cart) {
  return (cart?.items || []).map((item) => ({
    ...item,
    id: item.id,
    serverItem: true,
    name: item.productName,
    image: item.image || '',
    category: `${item.size} / ${item.color}`,
    price3day: formatVnd(item.rentalPrice),
    priceDeposit: formatVnd(item.deposit),
    qty: item.quantity,
  }));
}

function serverTotals(cart) {
  return {
    qty: cart?.itemCount || 0,
    rent: cart?.subtotal || 0,
    deposit: cart?.depositTotal || 0,
    total: cart?.grandTotalPreview || 0,
  };
}

function readSession(storage = getBrowserStorage()) {
  if (!storage) return null;
  try {
    return JSON.parse(storage.getItem(SESSION_KEY)) || null;
  } catch {
    return null;
  }
}

function selectDefaultVariant(product) {
  const variants = Array.isArray(product?.variants) ? product.variants : [];
  return variants.find((variant) => variant.isActive !== false && (variant.availableStock ?? 1) > 0)
    || variants.find((variant) => variant.isActive !== false)
    || variants[0];
}

function defaultRentalStartDate() {
  return new Date().toISOString().slice(0, 10);
}

function defaultRentalEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + DEFAULT_RENTAL_DAYS);
  return date.toISOString().slice(0, 10);
}

function dispatchCartChanged(cart) {
  dispatchAppEvent(typeof document !== 'undefined' ? document : null, CART_CHANGED_EVENT, cart);
}
