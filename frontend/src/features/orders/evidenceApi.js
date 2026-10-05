import api from '../../config/api.js';

export async function uploadEvidencePhotos(path, files) {
  if (files.length > 10) throw new Error('Chỉ được gửi tối đa 10 ảnh.');
  const ids = [];
  for (const file of files) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      throw new Error('Ảnh phải là JPEG, PNG hoặc WebP, tối đa 5 MB mỗi ảnh.');
    }
  }
  for (const file of files) {
    const data = new FormData();
    data.append('file', file);
    const response = await api.post(path, data, { headers: { 'Content-Type': 'multipart/form-data' } });
    ids.push(response.data.data.id);
  }
  return [...new Set(ids)];
}
