import { getApiErrorMessage } from './chatResponse.js';

const CHAT_API_URL = '/api/chat';
const NETWORK_ERROR_MESSAGE = 'Không kết nối được với AI. Kiểm tra lại kết nối mạng.';

export async function sendChatMessage(payload, { signal, fetcher = fetch } = {}) {
  const response = await fetcher(CHAT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(NETWORK_ERROR_MESSAGE);
    }
    throw new Error('Không đọc được phản hồi từ AI. Vui lòng thử lại.');
  }

  if (!response.ok) {
    throw new Error(getApiErrorMessage(data, NETWORK_ERROR_MESSAGE));
  }

  return data;
}

export { CHAT_API_URL };
