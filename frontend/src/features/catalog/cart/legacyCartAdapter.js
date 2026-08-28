import { addProductToCart, CART_KEY, getCart, saveCart } from '../../cart/cartService.js';

export function addProductToLegacyCart(product, quantity = 1, options = {}) {
  return addProductToCart(product, quantity, options);
}

export { CART_KEY, getCart, saveCart };
