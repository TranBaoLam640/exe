import api from '../../config/api.js';

export async function fetchShipperShipments(filters = {}) {
  const params = Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
  const response = await api.get('/api/shipper/shipments', { params });
  return response.data?.data || [];
}

export async function updateShipperShipmentStatus(id, status, note) {
  const response = await api.put(`/api/shipper/shipments/${encodeURIComponent(id)}/status`, {
    status,
    note: note?.trim() || null,
  });
  return response.data?.data;
}
