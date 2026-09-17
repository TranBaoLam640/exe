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

export async function fetchAdminPayment(orderId) {
  const response = await api.get(`/api/admin/orders/${encodeURIComponent(orderId)}/payment`);
  return response.data?.data;
}

export async function updateAdminPaymentStatus(paymentId, status, transactionCode) {
  const response = await api.put(`/api/admin/payments/${encodeURIComponent(paymentId)}/status`, {
    status,
    transactionCode: transactionCode?.trim() || null,
  });
  return response.data?.data;
}

export async function fetchAdminRefunds(filters = {}) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const response = await api.get('/api/admin/refunds', { params });
  return response.data?.data || [];
}

export async function createDepositSettlement(orderId, refundAmount, reason) {
  const response = await api.post(`/api/admin/orders/${encodeURIComponent(orderId)}/deposit-settlement`, { refundAmount, reason: reason?.trim() || null });
  return response.data?.data;
}

export async function updateAdminRefundStatus(refundId, status, transactionCode) {
  const response = await api.put(`/api/admin/refunds/${encodeURIComponent(refundId)}/status`, { status, transactionCode: transactionCode?.trim() || null });
  return response.data?.data;
}
