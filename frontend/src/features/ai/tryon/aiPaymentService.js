import api from '../../../config/api.js';
import { getBrowserStorage, readJsonValue, writeJsonValue } from '../../../utils/browserStorage.js';

export const AI_PENDING_PAYMENT_KEY = 'dorentme_ai_pending_payment';
export const AI_PAYMENT_POLL_INTERVAL_MS = 4000;
const PENDING_REUSE_WINDOW_MS = 15 * 60 * 1000;

function unwrap(response) {
  return response?.data?.data ?? response?.data;
}

export async function createAiPackagePayment(packageId) {
  return unwrap(await api.post('/api/ai-packages/payos', { packageId }));
}

export async function getAiPackagePaymentStatus(orderCode) {
  return unwrap(await api.get(`/api/ai-packages/payos/${encodeURIComponent(orderCode)}`));
}

export async function claimAiPackagePayment(orderCode) {
  return unwrap(await api.post(`/api/ai-packages/payos/${encodeURIComponent(orderCode)}/claim`));
}

export function getPendingAiPayment(storage = getBrowserStorage('localStorage')) {
  return readJsonValue(storage, AI_PENDING_PAYMENT_KEY, null);
}

export function savePendingAiPayment(payment, storage = getBrowserStorage('localStorage')) {
  writeJsonValue(storage, AI_PENDING_PAYMENT_KEY, { ...payment, savedAt: Date.now() });
}

export function clearPendingAiPayment(storage = getBrowserStorage('localStorage')) {
  storage?.removeItem(AI_PENDING_PAYMENT_KEY);
}

/** Reuse a recent unpaid PayOS link for the same package instead of creating a new one. */
export function getReusablePendingAiPayment(packageId, storage = getBrowserStorage('localStorage')) {
  const pending = getPendingAiPayment(storage);
  if (!pending || pending.packageId !== packageId || !pending.checkoutUrl) return null;
  if (!pending.savedAt || Date.now() - pending.savedAt > PENDING_REUSE_WINDOW_MS) return null;
  return pending;
}

