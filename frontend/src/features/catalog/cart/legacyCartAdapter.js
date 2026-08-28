const CART_KEY = 'dorentme_cart';

function readCart(storage = window.localStorage) {
  try {
    return JSON.parse(storage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function writeCart(cart, storage = window.localStorage, eventTarget = document) {
  storage.setItem(CART_KEY, JSON.stringify(cart));
  eventTarget.dispatchEvent(new CustomEvent('cart:changed', { detail: cart }));
}

export function addProductToLegacyCart(product, quantity = 1, options = {}) {
  const storage = options.storage || window.localStorage;
  const eventTarget = options.eventTarget || document;
  const qty = Math.max(1, Number.parseInt(quantity, 10) || 1);
  const cart = readCart(storage);
  const existing = cart.find((item) => item.name === product.name);

  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({
      name: product.name,
      image: product.image || '',
      category: product.category || product.categoryLabel || '',
      price3day: product.price3day || '',
      price1day: product.price1day || '',
      priceTag: product.priceTag || '',
      priceDeposit: product.priceDeposit || '',
      priceExtra: product.priceExtra || '',
      qty,
    });
  }

  writeCart(cart, storage, eventTarget);
  return cart;
}

export { CART_KEY };
