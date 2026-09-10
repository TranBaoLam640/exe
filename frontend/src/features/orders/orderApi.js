import api from '../../config/api.js';

export async function checkoutServerCart({ customer, voucherCode } = {}) {
  const response = await api.post('/api/orders/checkout', {
    customerName: customer?.name,
    customerPhone: customer?.phone,
    customerEmail: customer?.email || null,
    shippingAddress: customer?.address,
    customerNote: customer?.note || null,
    voucherCode: voucherCode || null,
  });

  return {
    ...response.data?.data,
    orders: (response.data?.data?.orders || []).map(mapBackendOrder),
  };
}

export async function fetchBackendOrders() {
  const response = await api.get('/api/orders');
  return (response.data?.data || []).map(mapBackendOrder);
}

export async function fetchBackendOrder(id) {
  const response = await api.get(`/api/orders/${encodeURIComponent(id)}`);
  return mapBackendOrder(response.data?.data);
}

export async function cancelBackendOrder(id) {
  const response = await api.post(`/api/orders/${encodeURIComponent(id)}/cancel`);
  return mapBackendOrder(response.data?.data);
}

export async function updateBackendOrderStatus(id, status, note) {
  const response = await api.put(`/api/orders/${encodeURIComponent(id)}/status`, {
    status,
    note: note || null,
  });
  return mapBackendOrder(response.data?.data);
}

export function mapBackendOrder(order) {
  if (!order) return null;

  return {
    ...order,
    id: order.id,
    code: order.orderCode,
    customer: {
      name: order.customer?.name || '',
      phone: order.customer?.phone || '',
      email: order.customer?.email || '',
      address: order.customer?.address || '',
      note: order.customer?.note || '',
    },
    items: (order.items || []).map((item) => ({
      ...item,
      name: item.name,
      image: item.image || '',
      qty: item.quantity,
      price3day: formatVnd(item.pricePerItem),
      priceDeposit: formatVnd(item.depositPerItem),
      rentalStartDate: item.rentalStartDate,
      rentalEndDate: item.rentalEndDate,
    })),
    totals: {
      rent: order.totals?.rent || 0,
      deposit: order.totals?.deposit || 0,
      discount: order.totals?.discount || 0,
      total: order.totals?.total || 0,
    },
    history: (order.history || []).map((entry) => ({
      ...entry,
      status: entry.status,
      note: entry.note || '',
      at: entry.at,
    })),
    backendOrder: true,
  };
}

function formatVnd(value) {
  return `${(value || 0).toLocaleString('vi-VN')} vnd`;
}
