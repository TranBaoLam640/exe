import { useEffect, useState } from 'react';

const SESSION_KEY = 'dorentme_session';
const CART_KEY = 'dorentme_cart';
const ORDERS_KEY = 'dorentme_orders';

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function readState() {
  const session = readJson(SESSION_KEY, null);
  const cart = readJson(CART_KEY, []);
  const orders = readJson(ORDERS_KEY, []);
  const cartQuantity = Array.isArray(cart)
    ? cart.reduce((sum, item) => sum + (Number(item?.qty) || 1), 0)
    : 0;

  return {
    session,
    cartQuantity,
    hasOrders: Array.isArray(orders) && orders.length > 0,
  };
}

export function useLegacyHeaderState() {
  const [state, setState] = useState(readState);

  useEffect(() => {
    const update = () => setState(readState());
    const onStorage = (event) => {
      if ([SESSION_KEY, CART_KEY, ORDERS_KEY].includes(event.key)) update();
    };

    document.addEventListener('auth:changed', update);
    document.addEventListener('cart:changed', update);
    document.addEventListener('orders:changed', update);
    window.addEventListener('storage', onStorage);

    return () => {
      document.removeEventListener('auth:changed', update);
      document.removeEventListener('cart:changed', update);
      document.removeEventListener('orders:changed', update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return state;
}
