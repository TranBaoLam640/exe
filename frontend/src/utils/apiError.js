export function getApiErrorMessage(error, fallback = 'Có lỗi xảy ra.') {
  const data = error?.response?.data;
  const candidates = [
    data?.error?.message,
    data?.title,
    data?.message,
    data?.error,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  }

  return fallback;
}
