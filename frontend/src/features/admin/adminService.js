import api from '../../config/api.js';

export async function fetchAdminSession() {
  const response = await api.get('/api/admin/session');
  return response.data?.data;
}
