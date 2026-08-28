import { dispatchAppEvent, getBrowserStorage, readArrayValue, writeJsonValue } from '../../utils/browserStorage.js';

export const CART_KEY = 'dorentme_cart';
export const CART_CHANGED_EVENT = 'cart:changed';

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
      const qty = Number(item?.qty) || 1;
      totals.qty += qty;
      totals.rent += parsePrice(item?.price3day) * qty;
      totals.deposit += parsePrice(item?.priceDeposit) * qty;
      totals.total = totals.rent + totals.deposit;
      return totals;
    },
    { qty: 0, rent: 0, deposit: 0, total: 0 },
  );
}

export function toLegacyCartItem(product, quantity) {
  return {
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
