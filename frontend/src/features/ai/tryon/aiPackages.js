import { getBrowserStorage, readJsonValue, writeJsonValue } from '../../../utils/browserStorage.js';
import { trackEvent } from '../../../utils/analytics.js';
import { recordAiTryOnEvent } from '../../analytics/visitTracker.js';
import { bumpTryOnCount, canUseTryOn, getTryOnCount, MAX_TRIES_PER_SESSION } from './tryOnSession.js';

export const AI_SUBSCRIPTION_KEY = 'dorentme_ai_subscription';
export const AI_SUBSCRIPTION_CHANGED_EVENT = 'ai:subscription_changed';

export const AI_PACKAGES = [
  {
    id: 'ai_single',
    name: 'Gói 1 Lượt Thử',
    badge: 'Trải nghiệm',
    price: 1000,
    priceDisplay: '1.000 đ',
    unit: '/ 1 lần thử',
    type: 'turns',
    turnsCount: 1,
    description: 'Thử nhanh 1 mẫu trang phục bất kỳ lên dáng người thật.',
    features: [
      '1 lượt thử AI chất lượng cao',
      'Tự do tải ảnh kết quả về máy',
      'Không giới hạn thời hạn sử dụng',
      'Thêm đồ vào giỏ ngay sau khi thử',
    ],
  },
  {
    id: 'ai_day_pass',
    name: 'Gói Ngày Không Giới Hạn',
    badge: 'Phổ biến nhất',
    highlight: true,
    price: 10000,
    priceDisplay: '10.000 đ',
    unit: '/ 24 giờ',
    type: 'unlimited_day',
    durationHours: 24,
    description: 'Thử đồ thỏa thích không giới hạn trong ngày, tha hồ phối đồ.',
    features: [
      'Thử KHÔNG GIỚI HẠN trong 24 giờ',
      'Đổi nhiều tư thế & trang phục',
      'Xử lý AI ưu tiên tốc độ cao',
      'Tải ảnh không giới hạn số lượng',
    ],
  },
  {
    id: 'ai_month_pass',
    name: 'Gói Tháng Không Giới Hạn',
    badge: 'Tiết kiệm nhất',
    price: 50000,
    priceDisplay: '50.000 đ',
    unit: '/ 30 ngày',
    type: 'unlimited_month',
    durationDays: 30,
    description: 'Gói VIP trọn gói dành cho người thường xuyên thuê đồ đi tiệc, sự kiện.',
    features: [
      'Thử KHÔNG GIỚI HẠN trong 30 ngày',
      'Tiết kiệm hơn 80% so với mua lẻ',
      'Xử lý AI độ ưu tiên cao nhất',
      'Lưu trữ kho đồ đã thử riêng',
      'Hỗ trợ kỹ thuật VIP 24/7',
    ],
  },
];

export function getAiSubscription(storage = getBrowserStorage('localStorage')) {
  return readJsonValue(storage, AI_SUBSCRIPTION_KEY, {
    activePlanId: null,
    activePlanName: null,
    planType: null,
    expiresAt: null,
    remainingTurns: 0,
    history: [],
  });
}

export function saveAiSubscription(subscription, storage = getBrowserStorage('localStorage')) {
  writeJsonValue(storage, AI_SUBSCRIPTION_KEY, subscription);
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(AI_SUBSCRIPTION_CHANGED_EVENT, { detail: subscription }));
  }
}

/**
 * Returns complete AI access status considering:
 * 1. Active unlimited subscriptions (day / month)
 * 2. Paid turns balance
 * 3. Free trial sessions
 */
export function getAiAccessStatus(
  localStorage = getBrowserStorage('localStorage'),
  sessionStorage = getBrowserStorage('sessionStorage'),
) {
  const sub = getAiSubscription(localStorage);
  const now = Date.now();

  // Check unlimited subscription
  if (sub.expiresAt && sub.expiresAt > now) {
    const diffMs = sub.expiresAt - now;
    const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
    const daysLeft = Math.floor(hoursLeft / 24);

    let timeText = '';
    if (daysLeft > 0) {
      timeText = `Còn ${daysLeft} ngày`;
    } else if (hoursLeft > 0) {
      timeText = `Còn ${hoursLeft} giờ`;
    } else {
      const minutesLeft = Math.max(1, Math.floor(diffMs / (1000 * 60)));
      timeText = `Còn ${minutesLeft} phút`;
    }

    return {
      allowed: true,
      mode: 'unlimited',
      planId: sub.activePlanId,
      planName: sub.activePlanName || 'Gói Không Giới Hạn',
      timeText,
      expiresAt: sub.expiresAt,
      badge: 'Không giới hạn',
      description: `${sub.activePlanName} (${timeText})`,
    };
  }

  // Check paid turns balance
  if (sub.remainingTurns && sub.remainingTurns > 0) {
    return {
      allowed: true,
      mode: 'turns',
      planId: sub.activePlanId || 'ai_single',
      planName: 'Lượt thử đã mua',
      remainingTurns: sub.remainingTurns,
      badge: `${sub.remainingTurns} lượt còn lại`,
      description: `Bạn có ${sub.remainingTurns} lượt thử đồ AI có phí`,
    };
  }

  // Check free trial
  const sessionCount = getTryOnCount(sessionStorage);
  if (canUseTryOn(sessionStorage)) {
    const remainingFree = MAX_TRIES_PER_SESSION - sessionCount;
    return {
      allowed: true,
      mode: 'free_trial',
      planId: 'free',
      planName: 'Thử nghiệm miễn phí',
      remainingFree,
      badge: `Thử miễn phí (còn ${remainingFree}/${MAX_TRIES_PER_SESSION} lượt)`,
      description: `Bạn còn ${remainingFree} lượt thử đồ AI miễn phí`,
    };
  }

  // Limit reached, need to purchase package
  return {
    allowed: false,
    mode: 'quota_exceeded',
    planId: null,
    planName: 'Hết lượt thử miễn phí',
    badge: 'Hết lượt thử',
    description: 'Bạn đã sử dụng hết 2 lượt thử miễn phí. Vui lòng đăng ký gói AI từ 1.000đ hoặc tạo tài khoản mới để tiếp tục.',
  };
}

/**
 * Deduct a try or verify access
 */
export function consumeAiTryOn(
  localStorage = getBrowserStorage('localStorage'),
  sessionStorage = getBrowserStorage('sessionStorage'),
) {
  const status = getAiAccessStatus(localStorage, sessionStorage);

  if (!status.allowed) {
    return { success: false, status };
  }

  recordAiTryOnEvent('ai_tryon_used');

  if (status.mode === 'unlimited') {
    trackEvent('ai_tryon_generate', { mode: 'unlimited', plan: status.planId });
    return { success: true, mode: 'unlimited', status };
  }

  if (status.mode === 'turns') {
    const sub = getAiSubscription(localStorage);
    sub.remainingTurns = Math.max(0, (sub.remainingTurns || 1) - 1);
    saveAiSubscription(sub, localStorage);
    trackEvent('ai_tryon_generate', { mode: 'turns', remainingTurns: sub.remainingTurns });
    return {
      success: true,
      mode: 'turns',
      remainingTurns: sub.remainingTurns,
      status: getAiAccessStatus(localStorage, sessionStorage),
    };
  }

  if (status.mode === 'free_trial') {
    bumpTryOnCount(sessionStorage);
    trackEvent('ai_tryon_generate', { mode: 'free_trial' });
    return {
      success: true,
      mode: 'free_trial',
      status: getAiAccessStatus(localStorage, sessionStorage),
    };
  }

  return { success: false, status };
}

/**
 * Activate/Purchase an AI Package
 */
export function purchaseAiPackage(packageId, paymentMethod = 'instant', options = {}) {
  const targetPackage = AI_PACKAGES.find((p) => p.id === packageId);
  if (!targetPackage) {
    throw new Error('Gói AI không tồn tại.');
  }

  const storage = options.storage || getBrowserStorage('localStorage');
  const sub = getAiSubscription(storage);
  const now = Date.now();

  let nextExpiresAt = sub.expiresAt && sub.expiresAt > now ? sub.expiresAt : now;

  if (targetPackage.type === 'turns') {
    sub.remainingTurns = (sub.remainingTurns || 0) + (targetPackage.turnsCount || 1);
    sub.activePlanId = targetPackage.id;
    sub.activePlanName = targetPackage.name;
  } else if (targetPackage.type === 'unlimited_day') {
    const durationMs = 24 * 60 * 60 * 1000;
    nextExpiresAt = (sub.expiresAt && sub.expiresAt > now ? sub.expiresAt : now) + durationMs;
    sub.expiresAt = nextExpiresAt;
    sub.planType = 'unlimited_day';
    sub.activePlanId = targetPackage.id;
    sub.activePlanName = targetPackage.name;
  } else if (targetPackage.type === 'unlimited_month') {
    const durationMs = 30 * 24 * 60 * 60 * 1000;
    nextExpiresAt = (sub.expiresAt && sub.expiresAt > now ? sub.expiresAt : now) + durationMs;
    sub.expiresAt = nextExpiresAt;
    sub.planType = 'unlimited_month';
    sub.activePlanId = targetPackage.id;
    sub.activePlanName = targetPackage.name;
  }

  const purchaseRecord = {
    id: 'tx_ai_' + Date.now().toString(36),
    packageId: targetPackage.id,
    packageName: targetPackage.name,
    price: targetPackage.price,
    paymentMethod,
    purchasedAt: new Date().toISOString(),
  };

  if (!Array.isArray(sub.history)) sub.history = [];
  sub.history.unshift(purchaseRecord);

  saveAiSubscription(sub, storage);

  trackEvent('purchase_ai_package', {
    package_id: targetPackage.id,
    package_name: targetPackage.name,
    value: targetPackage.price,
    currency: 'VND',
    payment_method: paymentMethod,
  });

  return {
    success: true,
    package: targetPackage,
    subscription: sub,
    record: purchaseRecord,
  };
}
