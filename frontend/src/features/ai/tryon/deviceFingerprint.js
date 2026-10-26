/**
 * DoRentMe Device Fingerprinting Utility
 * Tạo mã định danh phần cứng/trình duyệt ẩn để chống việc tạo nhiều tài khoản nhằm lạm dụng lượt thử đồ AI miễn phí.
 */

const FINGERPRINT_STORAGE_KEY = 'dorentme_device_fingerprint';

function hashString(str) {
  let hash1 = 0xdeadbeef ^ 0;
  let hash2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash1 = Math.imul(hash1 ^ ch, 2654435761);
    hash2 = Math.imul(hash2 ^ ch, 1597334677);
  }
  hash1 = Math.imul(hash1 ^ (hash1 >>> 16), 2246822507) ^ Math.imul(hash2 ^ (hash2 >>> 13), 3266489909);
  hash2 = Math.imul(hash2 ^ (hash2 >>> 16), 2246822507) ^ Math.imul(hash1 ^ (hash1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & hash2) + (hash1 >>> 0)).toString(16);
}

function getCanvasFingerprint() {
  try {
    if (typeof document === 'undefined') return 'node_env';
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no_canvas_ctx';

    // Vẽ hình họa và text để kích hoạt engine render font / GPU riêng của thiết bị
    ctx.textBaseline = 'top';
    ctx.font = '14px "Arial", sans-serif';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('DoRentMe AI <canvas> 2026', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('DoRentMe AI <canvas> 2026', 4, 17);

    return hashString(canvas.toDataURL());
  } catch {
    return 'canvas_err';
  }
}

/**
 * Lấy hoặc sinh mã Device Fingerprint ổn định của thiết bị.
 * Mã này tồn tại bền vững ngay cả khi người dùng mở ẩn danh (Incognito) hoặc tạo tài khoản mới.
 */
export function getDeviceFingerprint() {
  if (typeof window === 'undefined') return 'server_render';

  try {
    const cached = window.localStorage.getItem(FINGERPRINT_STORAGE_KEY);
    if (cached && cached.startsWith('dfp_') && cached.length >= 16) {
      return cached;
    }
  } catch {
    // Ignore storage errors in private browsing
  }

  const screenInfo = typeof window.screen !== 'undefined'
    ? `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`
    : '0x0x0';

  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const hwConcurrency = nav.hardwareConcurrency || 4;
  const devMemory = nav.deviceMemory || 4;
  const language = nav.language || 'vi';
  const tzOffset = new Date().getTimezoneOffset();
  const canvasHash = getCanvasFingerprint();

  const rawSignature = [
    screenInfo,
    hwConcurrency,
    devMemory,
    language,
    tzOffset,
    canvasHash,
  ].join('|');

  const fingerprint = `dfp_${hashString(rawSignature)}`;

  try {
    window.localStorage.setItem(FINGERPRINT_STORAGE_KEY, fingerprint);
  } catch {
    // Ignore
  }

  return fingerprint;
}
