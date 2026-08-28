import { dispatchAppEvent, getBrowserStorage, readArrayValue, writeJsonValue } from '../../utils/browserStorage.js';

export const ORDERS_KEY = 'dorentme_orders';
export const ORDERS_CHANGED_EVENT = 'orders:changed';
export const INITIAL_ORDER_STATUS = 'pending_confirmation';
export const INITIAL_HISTORY_NOTE = 'Khách đặt đơn & xác nhận đã chuyển khoản';

export const STATUS_LABELS = {
  pending_confirmation: 'Chờ xác nhận',
  shipping: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  return_requested: 'Đã yêu cầu trả hàng',
  return_processing: 'Đang xử lý trả hàng',
  returned: 'Đã hoàn tất trả hàng',
};

export const STATUS_ORDER = [
  'pending_confirmation',
  'shipping',
  'delivered',
  'return_requested',
  'return_processing',
  'returned',
];

export function genOrderId() {
  return `DH${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
}

export function getOrders(storage = getBrowserStorage()) {
  return readArrayValue(storage, ORDERS_KEY);
}

export function getOrderById(id, storage = getBrowserStorage()) {
  return getOrders(storage).find((order) => order.id === id) || null;
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

export function updateOrder(id, patch, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const orders = getOrders(storage);
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return null;

  Object.assign(orders[index], patch);
  saveOrders(orders, options);
  return orders[index];
}

function pushHistory(order, status, note) {
  order.history = order.history || [];
  order.history.push({ status, note: note || '', at: new Date().toISOString() });
}

function setStatus(id, status, extra, note, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const orders = getOrders(storage);
  const order = orders.find((candidate) => candidate.id === id);
  if (!order) return null;

  order.status = status;
  if (extra) Object.assign(order, extra);
  pushHistory(order, status, note);
  saveOrders(orders, options);
  return order;
}

export function confirmDelivery(id, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const order = getOrderById(id, storage);
  if (!order || order.status !== 'delivered') return order;
  return updateOrder(id, { deliveryConfirmed: true }, { ...options, storage });
}

export function requestReturn(id, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const order = getOrderById(id, storage);
  if (!order || order.status !== 'delivered') return order;
  return setStatus(
    id,
    'return_requested',
    { returnRequestedAt: new Date().toISOString() },
    'Khách yêu cầu trả hàng',
    { ...options, storage },
  );
}

export function shopConfirm(id, shipper, options = {}) {
  return setStatus(id, 'shipping', { shipper: shipper || null }, 'Shop xác nhận đơn, bắt đầu giao hàng', options);
}

export function markDelivered(id, options = {}) {
  return setStatus(id, 'delivered', {}, 'Shipper đã giao hàng thành công', options);
}

export function shopConfirmReturn(id, options = {}) {
  return setStatus(id, 'return_processing', {}, 'Shop xác nhận yêu cầu, đang sắp xếp lấy đồ trả', options);
}

export function markReturned(id, options = {}) {
  return setStatus(id, 'returned', {}, 'Đã nhận lại đồ, hoàn tất & hoàn cọc', options);
}

export function removeOrder(id, options = {}) {
  const storage = options.storage || getBrowserStorage();
  return saveOrders(getOrders(storage).filter((order) => order.id !== id), { ...options, storage });
}

export function filterOrdersForSession(orders, session) {
  return session
    ? orders.filter((order) => order.customerEmail === session.email || !order.customerEmail)
    : orders.filter((order) => !order.customerEmail);
}

export function formatOrderDate(value) {
  try {
    return new Date(value).toLocaleString('vi-VN');
  } catch {
    return value;
  }
}
