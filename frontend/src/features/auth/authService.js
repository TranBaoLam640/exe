import { dispatchAppEvent, getBrowserStorage, readArrayValue, readJsonValue, writeJsonValue } from '../../utils/browserStorage.js';
import { getApiErrorMessage as getSharedApiErrorMessage } from '../../utils/apiError.js';
import api from "../../config/api.js";
import { syncGuestCartToServer } from '../cart/cartService.js';
import { isDisposableEmail } from './disposableEmailBlocklist.js';
import { parseGoogleJwt } from './googleOAuth.js';

export const USERS_KEY = 'dorentme_users';
export const SESSION_KEY = 'dorentme_session';
export const CLAIMED_TRIALS_KEY = 'dorentme_claimed_trials';
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
  const session = {
    userId: user.userId,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    token: user.token,
    avatar: user.avatar || null,
    authProvider: user.authProvider || null,
  };

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

export function hasClaimedFreeTrial(email, storage = getBrowserStorage('localStorage')) {
  if (!email) return false;
  const claimed = readArrayValue(storage, CLAIMED_TRIALS_KEY);
  return claimed.includes(normalizeEmail(email));
}

export function markFreeTrialClaimed(email, storage = getBrowserStorage('localStorage')) {
  if (!email) return;
  const normalized = normalizeEmail(email);
  const claimed = readArrayValue(storage, CLAIMED_TRIALS_KEY);
  if (!claimed.includes(normalized)) {
    claimed.push(normalized);
    writeJsonValue(storage, CLAIMED_TRIALS_KEY, claimed);
  }
}

export function handleTrialQuotaOnLogin(email, options = {}) {
  const localStorage = options.storage || getBrowserStorage('localStorage');
  const sessStorage = options.sessionStorage || getBrowserStorage('sessionStorage');

  if (!hasClaimedFreeTrial(email, localStorage)) {
    markFreeTrialClaimed(email, localStorage);
    try {
      sessStorage?.setItem('dorentme_tryon_count', '0');
    } catch {
      // Bỏ qua nếu môi trường không hỗ trợ storage
    }
  }
}

export async function loginWithGoogle(profileOrCredential, options = {}) {
  let profile = profileOrCredential;
  if (typeof profileOrCredential === 'string') {
    profile = parseGoogleJwt(profileOrCredential);
  }

  if (!profile || !profile.email) {
    return { ok: false, error: 'Không thể xác thực thông tin tài khoản Google.' };
  }

  const cleanEmail = normalizeEmail(profile.email);

  if (isDisposableEmail(cleanEmail)) {
    return { ok: false, error: 'Email không hợp lệ. Vui lòng sử dụng tài khoản Google với email thật.' };
  }

  if (profile.email_verified === false) {
    return { ok: false, error: 'Tài khoản Google này chưa được xác thực email. Vui lòng kiểm tra lại.' };
  }

  const cleanName = (profile.name || cleanEmail.split('@')[0] || 'Khách hàng').trim();
  const avatar = profile.picture || null;
  const googleId = profile.sub || `g_${Date.now()}`;
  const isFirstClaim = !hasClaimedFreeTrial(cleanEmail, options.storage || getBrowserStorage('localStorage'));

  try {
    const response = await api.post('/api/auth/google', {
      email: cleanEmail,
      name: cleanName,
      googleId,
      avatar,
      idToken: typeof profileOrCredential === 'string' ? profileOrCredential : null,
    });

    const authData = response.data?.data;
    const user = authData?.user ?? authData;
    const session = setSession(user, options);

    handleTrialQuotaOnLogin(cleanEmail, options);
    syncGuestCartToServer(options).catch(() => {});

    return {
      ok: true,
      user: session,
      auth: authData,
      isNewUser: isFirstClaim,
    };
  } catch {
    // Client-side fallback for prototype/standalone environments
    const storage = options.storage || getBrowserStorage('localStorage');
    const users = getUsers(storage);
    let existingUser = users.find((u) => normalizeEmail(u.email) === cleanEmail);
    const isNewUser = !existingUser;

    if (!existingUser) {
      existingUser = {
        userId: `google_${googleId}`,
        name: cleanName,
        email: cleanEmail,
        phone: '',
        role: 'CUSTOMER',
        avatar,
        authProvider: 'google',
        createdAt: new Date().toISOString(),
      };
      users.push(existingUser);
      saveUsers(users, storage);
    }

    const sessionUser = {
      userId: existingUser.userId || `google_${googleId}`,
      name: existingUser.name || cleanName,
      email: cleanEmail,
      phone: existingUser.phone || '',
      role: existingUser.role || 'CUSTOMER',
      token: `oauth_google_${Date.now()}`,
      avatar: avatar || existingUser.avatar,
      authProvider: 'google',
    };

    const session = setSession(sessionUser, options);
    handleTrialQuotaOnLogin(cleanEmail, options);
    syncGuestCartToServer(options).catch(() => {});

    return {
      ok: true,
      user: session,
      isNewUser,
    };
  }
}

export async function register({ name, email, phone, password, role }, options = {}) {
  const cleanName = (name || '').trim();
  const cleanEmail = normalizeEmail(email);
  const cleanPhone = (phone || '').trim();
  const cleanRole = String(role || 'CUSTOMER').trim().toUpperCase();

  // Validation frontend vẫn giữ
  if (cleanName.length < 2) {
    return { ok: false, error: 'Vui lòng nhập họ tên.' };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return { ok: false, error: 'Email không hợp lệ.' };
  }

  // Chống spam tài khoản rác / email ảo
  if (isDisposableEmail(cleanEmail)) {
    return {
      ok: false,
      error: 'Hệ thống không chấp nhận email tạm thời/rác để tránh spam tài khoản. Vui lòng sử dụng email thật hoặc Đăng nhập bằng Google.',
    };
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
      role: cleanRole,
    });

    const authData = response.data?.data;

    // Tạm thời vẫn lưu session local để code frontend cũ tiếp tục chạy
    const user = authData?.user ?? authData;

    const session = setSession(user, options);

    // Cấp 2 lượt thử đồ AI miễn phí cho email mới tạo (chống spam trùng lặp)
    handleTrialQuotaOnLogin(cleanEmail, options);

    syncGuestCartToServer(options).catch((error) => {
      console.warn('CART SYNC ERROR:', error);
    });

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
    syncGuestCartToServer(options).catch((error) => {
      console.warn('CART SYNC ERROR:', error);
    });

    return {
      ok: true,
      user: session,
      auth: authData,
    };
  } catch (error) {
    console.error('LOGIN ERROR:', error);

    return {
      ok: false,
      error: getSharedApiErrorMessage(
        error,
        'Email hoặc mật khẩu không đúng.'
      ),
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
