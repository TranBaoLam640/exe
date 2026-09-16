import api from '../../config/api.js';
import { getApiErrorMessage } from '../../utils/apiError.js';

export const INVENTORY_CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'WORN', 'DAMAGED'];

export const INVENTORY_STATUSES = [
  'AVAILABLE',
  'RESERVED',
  'RENTED',
  'CLEANING',
  'MAINTENANCE',
  'DAMAGED',
  'LOST',
  'RETIRED',
];

export function inventoryErrorMessage(error, fallback = 'Unable to complete inventory request.') {
  const code = error?.response?.data?.error?.code || error?.response?.data?.code;
  if (code === 'INVENTORY_HAS_RENTAL_HISTORY') {
    return 'This inventory item has rental history and cannot be permanently deleted. Change its status to RETIRED instead.';
  }

  return getApiErrorMessage(error, fallback);
}

export async function getInventory(filters = {}) {
  const response = await api.get('/api/inventory', {
    params: cleanParams(filters),
  });
  return response.data?.data || [];
}

export async function getInventoryById(id) {
  const response = await api.get(`/api/inventory/${id}`);
  return response.data?.data;
}

export async function getProductInventory(productId) {
  const response = await api.get(`/api/products/${productId}/inventory`);
  return response.data?.data || [];
}

export async function createInventory(productId, variantId, payload) {
  const response = await api.post(
    `/api/products/${productId}/variants/${variantId}/inventory`,
    normalizeInventoryPayload(payload),
  );
  return response.data?.data;
}

export async function updateInventory(id, payload) {
  const response = await api.put(`/api/inventory/${id}`, normalizeInventoryPayload(payload));
  return response.data?.data;
}

export async function updateInventoryStatus(id, status) {
  const response = await api.put(`/api/inventory/${id}/status`, {
    status: String(status || '').trim().toUpperCase(),
  });
  return response.data?.data;
}

export async function deleteInventory(id) {
  await api.delete(`/api/inventory/${id}`);
}

export async function getProductAvailability(productId, startDate, endDate) {
  const response = await api.get(`/api/products/${productId}/availability`, {
    params: cleanParams({ startDate, endDate }),
  });
  return response.data?.data;
}

function cleanParams(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function normalizeInventoryPayload(payload = {}) {
  return {
    assetCode: String(payload.assetCode || '').trim(),
    condition: String(payload.condition || 'GOOD').trim().toUpperCase(),
    notes: payload.notes ? String(payload.notes).trim() : null,
    acquiredAt: payload.acquiredAt || null,
  };
}
