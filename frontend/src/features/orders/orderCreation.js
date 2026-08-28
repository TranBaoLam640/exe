import { dispatchAppEvent, getBrowserStorage, readArrayValue, writeJsonValue } from '../../utils/browserStorage.js';

export const ORDERS_KEY = 'dorentme_orders';
export const ORDERS_CHANGED_EVENT = 'orders:changed';
export const INITIAL_ORDER_STATUS = 'pending_confirmation';
export const INITIAL_HISTORY_NOTE = 'Khách đặt đơn & xác nhận đã chuyển khoản';

export function genOrderId() {
  return `DH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function getOrders(storage = getBrowserStorage()) {
  return readArrayValue(storage, ORDERS_KEY);
}

export function saveOrders(orders, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);

  writeJsonValue(storage, ORDERS_KEY, orders);
  dispatchAppEvent(eventTarget, ORDERS_CHANGED_EVENT, orders);
  return orders;
}

export function createCheckoutOrder({ id, items, customer, totals, customerEmail }, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const orders = getOrders(storage);
  const order = {
    id: id || genOrderId(),
    createdAt: new Date().toISOString(),
    items: items || [],
    customer: customer || {},
    customerEmail: customerEmail || null,
    totals: totals || { rent: 0, deposit: 0, total: 0 },
    status: INITIAL_ORDER_STATUS,
    deliveryConfirmed: false,
    shipper: null,
    returnRequestedAt: null,
    history: [],
  };

  order.history.push({
    status: INITIAL_ORDER_STATUS,
    note: INITIAL_HISTORY_NOTE,
    at: new Date().toISOString(),
  });

  orders.unshift(order);
  saveOrders(orders, options);
  return order;
}
