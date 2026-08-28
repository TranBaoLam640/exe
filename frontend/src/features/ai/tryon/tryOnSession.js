import { getBrowserStorage } from '../../../utils/browserStorage.js';

export const TRYON_COUNT_KEY = 'dorentme_tryon_count';
export const MAX_TRIES_PER_SESSION = 5;

export function getTryOnCount(storage = getBrowserStorage('sessionStorage')) {
  return Number.parseInt(storage?.getItem(TRYON_COUNT_KEY) || '0', 10) || 0;
}

export function canUseTryOn(storage = getBrowserStorage('sessionStorage')) {
  return getTryOnCount(storage) < MAX_TRIES_PER_SESSION;
}

export function bumpTryOnCount(storage = getBrowserStorage('sessionStorage')) {
  const nextCount = getTryOnCount(storage) + 1;
  storage?.setItem(TRYON_COUNT_KEY, String(nextCount));
  return nextCount;
}
