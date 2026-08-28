export function readJsonValue(storage, key, fallback) {
  if (!storage) return fallback;

  try {
    const raw = storage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

export function readArrayValue(storage, key) {
  const value = readJsonValue(storage, key, []);
  return Array.isArray(value) ? value : [];
}

export function writeJsonValue(storage, key, value) {
  storage.setItem(key, JSON.stringify(value));
}

export function dispatchAppEvent(eventTarget, eventName, detail) {
  if (!eventTarget) return;
  eventTarget.dispatchEvent(new CustomEvent(eventName, { detail }));
}

export function getBrowserStorage(kind = 'localStorage') {
  if (typeof window === 'undefined') return null;
  return window[kind] || null;
}
