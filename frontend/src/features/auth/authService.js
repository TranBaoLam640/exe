import { dispatchAppEvent, getBrowserStorage, readArrayValue, readJsonValue, writeJsonValue } from '../../utils/browserStorage.js';
import api from "../../config/api";
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
  const cleanName = (name || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = (phone || '').trim();

  // Validation frontend vẫn giữ
  if (cleanName.length < 2) {
    return { ok: false, error: 'Vui lòng nhập họ tên.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Email không hợp lệ.' };
  }

  if (!/^[0-9]{9,11}$/.test(cleanPhone.replace(/[\s.\-]/g, ''))) {
    return { ok: false, error: 'Số điện thoại không hợp lệ.' };
  }

  if (!password || password.length < 6) {
    return { ok: false, error: 'Mật khẩu cần tối thiểu 6 ký tự.' };
  }

  try {
    const response = await api.post('/api/auth/register', {
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone || null,
      password,
      role: 'CUSTOMER',
    });

    const authData = response.data?.data;

    // Tạm thời vẫn lưu session local để code frontend cũ tiếp tục chạy
    const user = authData?.user ?? authData;

    const session = setSession(user, options);

    return {
      ok: true,
      user: session,
      auth: authData,
    };
  } catch (error) {
    console.error('REGISTER ERROR:', error);

    return {
      ok: false,
      error: getApiErrorMessage(
        error,
        'Email hoặc mật khẩu không đúng.'
      ),
    };
  }
}

export async function login(email, password, options = {}) {
  const cleanEmail = normalizeEmail(email);

  if (!cleanEmail) {
    return { ok: false, error: 'Vui lòng nhập email.' };
  }

  if (!password) {
    return { ok: false, error: 'Vui lòng nhập mật khẩu.' };
  }

  try {
    const response = await api.post('/api/auth/login', {
      email: cleanEmail,
      password,
    });

    const authData = response.data?.data;

    // Tạm thời giữ session local cho frontend hiện tại
    const user = authData?.user ?? authData;

    const session = setSession(user, options);

    return {
      ok: true,
      user: session,
      auth: authData,
    };
  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return {
      ok: false,
      error:
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Email hoặc mật khẩu không đúng.',
    };
  }
}

export async function logout(options = {}) {
  clearSession(options);

  try {
    await api.post('/api/auth/logout');
  } catch (error) {
    console.error('LOGOUT ERROR:', error);
  }
}

function getApiErrorMessage(error, fallback = 'Có lỗi xảy ra.') {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
}