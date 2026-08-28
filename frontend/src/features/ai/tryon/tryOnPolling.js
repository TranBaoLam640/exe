export const TRYON_POLL_INTERVAL_MS = 3000;
export const TRYON_MAX_POLL_ATTEMPTS = 40;

export function getResultImageUrl(data) {
  const url = data?.image?.url;
  return typeof url === 'string' && url.trim() ? url : '';
}

export async function pollTryOnStatus(requestId, {
  getStatus,
  onProgress = () => {},
  signal,
  delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  intervalMs = TRYON_POLL_INTERVAL_MS,
  maxAttempts = TRYON_MAX_POLL_ATTEMPTS,
} = {}) {
  if (!requestId) throw new Error('AI không trả về mã yêu cầu hợp lệ.');
  if (typeof getStatus !== 'function') throw new Error('Thiếu hàm kiểm tra trạng thái AI.');

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    await delay(intervalMs);
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

    const data = await getStatus(requestId, { signal });
    if (data?.status === 'IN_QUEUE') {
      onProgress('Đang chờ trong hàng đợi...');
    } else if (data?.status === 'IN_PROGRESS') {
      onProgress('AI đang xử lý ảnh của bạn...');
    } else if (data?.status === 'FAILED') {
      throw new Error(data?.error?.message || 'AI xử lý thất bại, vui lòng thử lại.');
    } else if (data?.status === 'COMPLETED') {
      const resultImageUrl = getResultImageUrl(data);
      if (!resultImageUrl) throw new Error('AI không trả về ảnh kết quả.');
      return { ...data, resultImageUrl };
    }
  }

  throw new Error('Xử lý quá lâu, vui lòng thử lại sau.');
}
