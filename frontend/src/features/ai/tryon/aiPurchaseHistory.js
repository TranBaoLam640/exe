import { getBrowserStorage, readArrayValue, writeJsonValue } from '../../../utils/browserStorage.js';
import { getAiSubscription, saveAiSubscription } from './aiPackages.js';

export const AI_PURCHASE_STORAGE_KEY = 'dorentme_ai_purchase_history';
export const AI_PURCHASE_UPDATED_EVENT = 'ai:purchase_history_updated';

export const MOCK_AI_PURCHASE_ACCOUNTS = [
  {
    orderCode: '1731112480921',
    email: 'hoangth12@gmail.com',
    customerName: 'Hoàng Thị Thu Thảo',
    packageId: 'ai_month_pass',
    packageName: 'Gói Tháng Không Giới Hạn',
    price: 50000,
    priceDisplay: '50.000 đ',
    durationText: '30 ngày',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-08T14:32:15.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
  {
    orderCode: '1731124591024',
    email: 'duonghippi123@gmail.com',
    customerName: 'Nguyễn Đức Dương',
    packageId: 'ai_day_pass',
    packageName: 'Gói Ngày Không Giới Hạn',
    price: 10000,
    priceDisplay: '10.000 đ',
    durationText: '24 giờ',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-08T18:45:00.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
  {
    orderCode: '1731131284912',
    email: 'monome899@gmail.com',
    customerName: 'Trần Minh Quang',
    packageId: 'ai_day_pass',
    packageName: 'Gói Ngày Không Giới Hạn',
    price: 10000,
    priceDisplay: '10.000 đ',
    durationText: '24 giờ',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-09T07:15:30.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
  {
    orderCode: '1731135492109',
    email: 'mmongduc367@gmail.com',
    customerName: 'Phạm Đức Mộng',
    packageId: 'ai_day_pass',
    packageName: 'Gói Ngày Không Giới Hạn',
    price: 10000,
    priceDisplay: '10.000 đ',
    durationText: '24 giờ',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-09T08:02:18.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
  {
    orderCode: '1731137810452',
    email: 'chiennguyen0012@gmail.com',
    customerName: 'Nguyễn Văn Chiến',
    packageId: 'ai_day_pass',
    packageName: 'Gói Ngày Không Giới Hạn',
    price: 10000,
    priceDisplay: '10.000 đ',
    durationText: '24 giờ',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-09T08:35:42.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
  {
    orderCode: '1731139450123',
    email: 'nonsense7890@gmail.com',
    customerName: 'Lê Hoàng Nam',
    packageId: 'ai_day_pass',
    packageName: 'Gói Ngày Không Giới Hạn',
    price: 10000,
    priceDisplay: '10.000 đ',
    durationText: '24 giờ',
    paymentMethod: 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: '2026-11-09T09:05:10.000Z',
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  },
];

export function getAiPurchaseHistory(storage = getBrowserStorage('localStorage')) {
  const existing = readArrayValue(storage, AI_PURCHASE_STORAGE_KEY);
  if (!existing || existing.length === 0) {
    if (storage) {
      writeJsonValue(storage, AI_PURCHASE_STORAGE_KEY, MOCK_AI_PURCHASE_ACCOUNTS);
    }
    return MOCK_AI_PURCHASE_ACCOUNTS;
  }
  return existing;
}

export function saveAiPurchaseHistory(list, storage = getBrowserStorage('localStorage')) {
  writeJsonValue(storage, AI_PURCHASE_STORAGE_KEY, list);
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(AI_PURCHASE_UPDATED_EVENT, { detail: list }));
  }
}

export function recordNewAiPurchase(record, customer = {}, storage = getBrowserStorage('localStorage')) {
  const current = getAiPurchaseHistory(storage);
  const newEntry = {
    orderCode: String(record.orderCode || Date.now()),
    email: customer.email || 'khach@dorentme.vn',
    customerName: customer.name || 'Khách hàng PayOS',
    packageId: record.packageId,
    packageName: record.packageName,
    price: record.price,
    priceDisplay: record.price ? `${record.price.toLocaleString('vi-VN')} đ` : '10.000 đ',
    durationText: record.packageId === 'ai_month_pass' ? '30 ngày' : record.packageId === 'ai_day_pass' ? '24 giờ' : '1 lượt',
    paymentMethod: record.paymentMethod || 'payos',
    providerName: 'PayOS (VietQR)',
    purchasedAt: record.purchasedAt || new Date().toISOString(),
    status: 'PAID',
    statusText: 'Đã kích hoạt',
  };
  const updated = [newEntry, ...current];
  saveAiPurchaseHistory(updated, storage);
  return updated;
}

export function getAiPurchasesSummary(storage = getBrowserStorage('localStorage')) {
  const list = getAiPurchaseHistory(storage);
  const totalRevenue = list.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const totalCount = list.length;
  const dayPassList = list.filter((item) => item.packageId === 'ai_day_pass');
  const monthPassList = list.filter((item) => item.packageId === 'ai_month_pass');
  const dayPassCount = dayPassList.length;
  const monthPassCount = monthPassList.length;
  const dayPassRevenue = dayPassList.reduce((acc, item) => acc + (Number(item.price) || 0), 0);
  const monthPassRevenue = monthPassList.reduce((acc, item) => acc + (Number(item.price) || 0), 0);

  return {
    totalRevenue,
    totalCount,
    dayPassCount,
    monthPassCount,
    dayPassRevenue,
    monthPassRevenue,
    list,
  };
}

/**
 * When one of the 6 simulated accounts logs in, seamlessly hydrate their active AI subscription.
 */
export function syncUserAiSubscriptionOnLogin(email, storage = getBrowserStorage('localStorage')) {
  if (!email) return null;
  const clean = String(email).trim().toLowerCase();
  const matched = MOCK_AI_PURCHASE_ACCOUNTS.find((item) => item.email.toLowerCase() === clean);
  if (!matched) return null;

  const sub = getAiSubscription(storage);
  const now = Date.now();

  const isMonth = matched.packageId === 'ai_month_pass';
  const durationMs = (isMonth ? 30 : 1) * 24 * 60 * 60 * 1000;
  const nextExpiresAt = now + durationMs;

  const transactionRecord = {
    id: `tx_ai_${matched.orderCode}`,
    packageId: matched.packageId,
    packageName: matched.packageName,
    price: matched.price,
    paymentMethod: matched.paymentMethod,
    orderCode: matched.orderCode,
    purchasedAt: matched.purchasedAt,
  };

  const nextHistory = Array.isArray(sub.history) ? [...sub.history] : [];
  if (!nextHistory.some((h) => h.orderCode === matched.orderCode)) {
    nextHistory.unshift(transactionRecord);
  }

  const updatedSub = {
    ...sub,
    activePlanId: matched.packageId,
    activePlanName: matched.packageName,
    planType: isMonth ? 'unlimited_month' : 'unlimited_day',
    expiresAt: Math.max(sub.expiresAt || 0, nextExpiresAt),
    history: nextHistory,
  };

  saveAiSubscription(updatedSub, storage);
  return updatedSub;
}
