import { addProductToCart, CART_KEY } from '../src/features/cart/cartService.js';
import { products } from '../src/features/catalog/data/products.js';

const storage = new Map();
const events = [];
const fakeStorage = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, value);
  },
};
const fakeEventTarget = {
  dispatchEvent(event) {
    events.push(event);
  },
};
const product = products[0];

addProductToCart(product, 2, { storage: fakeStorage, eventTarget: fakeEventTarget });
addProductToCart(product, 3, { storage: fakeStorage, eventTarget: fakeEventTarget });

const cart = JSON.parse(fakeStorage.getItem(CART_KEY));
const expectedFields = ['name', 'image', 'category', 'price3day', 'price1day', 'priceTag', 'priceDeposit', 'priceExtra', 'qty'];
const failures = [];

function check(condition, message) {
  if (!condition) failures.push(message);
}

check(CART_KEY === 'dorentme_cart', 'cart key changed');
check(cart.length === 1, `expected duplicate-name merge to one item, got ${cart.length}`);
check(cart[0].qty === 5, `expected merged quantity 5, got ${cart[0]?.qty}`);
check(cart[0].image === product.image, 'cart image must remain legacy source path');
check(expectedFields.every((field) => Object.hasOwn(cart[0], field)), 'stored cart fields changed');
check(Object.keys(cart[0]).every((field) => expectedFields.includes(field)), 'unexpected field stored in cart item');
check(events.length === 2, `expected two cart:changed events, got ${events.length}`);
check(events.every((event) => event.type === 'cart:changed'), 'event type changed');

if (failures.length) {
  console.error(`legacy cart validation FAIL\n- ${failures.join('\n- ')}`);
  process.exit(1);
}

console.log('legacy cart validation PASS');
console.log(`storageKey=${CART_KEY}`);
console.log(`storedFields=${expectedFields.join(',')}`);
console.log(`mergedQty=${cart[0].qty}`);
console.log(`events=${events.length}`);
