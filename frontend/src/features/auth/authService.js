import { dispatchAppEvent, getBrowserStorage, readArrayValue, readJsonValue, writeJsonValue } from '../../utils/browserStorage.js';

export const USERS_KEY = 'dorentme_users';
export const SESSION_KEY = 'dorentme_session';
export const AUTH_CHANGED_EVENT = 'auth:changed';

export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase();
}

export async function sha256(text) {
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getUsers(storage = getBrowserStorage()) {
  return readArrayValue(storage, USERS_KEY);
}

export function saveUsers(users, storage = getBrowserStorage()) {
  writeJsonValue(storage, USERS_KEY, users);
}

export function getSession(storage = getBrowserStorage()) {
  return readJsonValue(storage, SESSION_KEY, null);
}

export function setSession(user, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);
  const session = { name: user.name, email: user.email, phone: user.phone };

  writeJsonValue(storage, SESSION_KEY, session);
  dispatchAppEvent(eventTarget, AUTH_CHANGED_EVENT, session);
  return session;
}

export function clearSession(options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);

  storage?.removeItem(SESSION_KEY);
  dispatchAppEvent(eventTarget, AUTH_CHANGED_EVENT, null);
}

export async function register({ name, email, phone, password }, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);
  const cleanName = (name || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = (phone || '').trim();

  if (cleanName.length < 2) return { ok: false, error: 'Vui lòng nhập họ tên.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return { ok: false, error: 'Email không hợp lệ.' };
  if (!/^[0-9]{9,11}$/.test(cleanPhone.replace(/[\s.\-]/g, ''))) return { ok: false, error: 'Số điện thoại không hợp lệ.' };
  if (!password || password.length < 6) return { ok: false, error: 'Mật khẩu cần tối thiểu 6 ký tự.' };

  const users = getUsers(storage);
  if (users.some((user) => user.email === cleanEmail)) {
    return { ok: false, error: 'Email này đã được đăng ký. Vui lòng đăng nhập.' };
  }

  const passwordHash = await sha256(password);
  const user = {
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users, storage);
  const session = setSession(user, { storage, eventTarget });
  return { ok: true, user: session };
}

export async function login(email, password, options = {}) {
  const storage = options.storage || getBrowserStorage();
  const eventTarget = options.eventTarget || (typeof document !== 'undefined' ? document : null);
  const cleanEmail = normalizeEmail(email);
  const users = getUsers(storage);
  const user = users.find((candidate) => candidate.email === cleanEmail);

  if (!user) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };

  const passwordHash = await sha256(password || '');
  if (passwordHash !== user.passwordHash) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };

  const session = setSession(user, { storage, eventTarget });
  return { ok: true, user: session };
}

export function logout(options = {}) {
  clearSession(options);
}
