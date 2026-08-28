const TRYON_API_URL = '/api/tryon';

export function getApiErrorMessage(data, fallback = 'Không gửi được yêu cầu tới AI. Vui lòng thử lại.') {
  const error = data?.error;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  if (typeof data?.detail === 'string' && data.detail.trim()) return data.detail;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

async function readJsonResponse(response, fallback) {
  try {
    return await response.json();
  } catch {
    if (!response.ok) throw new Error(fallback);
    throw new Error('Không đọc được phản hồi từ AI. Vui lòng thử lại.');
  }
}

export async function createTryOn({ humanImage, garmentImageUrl }, { signal, fetcher = fetch } = {}) {
  const response = await fetcher(TRYON_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ humanImage, garmentImageUrl }),
    signal,
  });

  const data = await readJsonResponse(response, 'Không gửi được yêu cầu tới AI. Vui lòng thử lại.');
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data));
  }

  if (typeof data?.requestId !== 'string' || !data.requestId.trim()) {
    throw new Error('AI không trả về mã yêu cầu hợp lệ.');
  }

  return { requestId: data.requestId };
}

export async function getTryOnStatus(requestId, { signal, fetcher = fetch } = {}) {
  const response = await fetcher(`${TRYON_API_URL}?id=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    signal,
  });

  const data = await readJsonResponse(response, 'Không kiểm tra được trạng thái xử lý.');
  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, 'Không kiểm tra được trạng thái xử lý.'));
  }

  return data;
}

export { TRYON_API_URL };
