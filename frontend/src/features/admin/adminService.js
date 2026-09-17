import api from '../../config/api.js';
import { mapBackendOrder } from '../orders/orderApi.js';

export async function fetchAdminSession() {
  const response = await api.get('/api/admin/session');
  return response.data?.data;
}

export async function fetchAdminOrders(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const response = await api.get('/api/admin/orders', { params });
  return response.data?.data || [];
}

export async function fetchAdminOrder(id) {
  const response = await api.get(`/api/admin/orders/${encodeURIComponent(id)}`);
  return mapBackendOrder(response.data?.data);
}
