import assert from 'node:assert/strict';
import {
  AI_PACKAGES,
  consumeAiTryOn,
  getAiAccessStatus,
  getAiSubscription,
  purchaseAiPackage,
  saveAiSubscription,
} from '../src/features/ai/tryon/aiPackages.js';
import {
  getTrafficAnalytics,
  loadTrafficData,
  recordAiTryOnEvent,
  recordVisit,
  resetTrafficAnalytics,
} from '../src/features/analytics/visitTracker.js';
import { getGaMeasurementId, initGoogleAnalytics, trackEvent, trackPageView } from '../src/utils/analytics.js';

function createMemoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  };
}

// -------------------------------------------------------------
// Test 1: AI Packages configuration
// -------------------------------------------------------------
assert.equal(AI_PACKAGES.length, 3, 'Must have 3 AI packages');

const pkg1k = AI_PACKAGES.find((p) => p.price === 1000);
assert.ok(pkg1k, 'Gói 1k must exist');
assert.equal(pkg1k.turnsCount, 1, '1k package must give 1 try');

const pkg10k = AI_PACKAGES.find((p) => p.price === 10000);
assert.ok(pkg10k, 'Gói 10k must exist');
assert.equal(pkg10k.type, 'unlimited_day', '10k package must be unlimited day');
assert.equal(pkg10k.durationHours, 24, '10k package must be 24 hours');

const pkg50k = AI_PACKAGES.find((p) => p.price === 50000);
assert.ok(pkg50k, 'Gói 50k must exist');
assert.equal(pkg50k.type, 'unlimited_month', '50k package must be unlimited month');
assert.equal(pkg50k.durationDays, 30, '50k package must be 30 days');

// -------------------------------------------------------------
// Test 2: AI Subscription & Purchase Flow
// -------------------------------------------------------------
const memLocal = createMemoryStorage();
const memSession = createMemoryStorage({ dorentme_tryon_count: '5' }); // maxed free trial

// With maxed free trial and no packages, access is disallowed
const statusQuotaExceeded = getAiAccessStatus(memLocal, memSession);
assert.equal(statusQuotaExceeded.allowed, false, 'Should be quota exceeded');

// Purchase 1 turn package (1k)
const res1k = purchaseAiPackage('ai_single', 'instant', { storage: memLocal });
assert.equal(res1k.success, true);
assert.equal(res1k.package.price, 1000);

const statusTurns = getAiAccessStatus(memLocal, memSession);
assert.equal(statusTurns.allowed, true);
assert.equal(statusTurns.mode, 'turns');
assert.equal(statusTurns.remainingTurns, 1);

// Consume turn
const consumeTurnsRes = consumeAiTryOn(memLocal, memSession);
assert.equal(consumeTurnsRes.success, true);
assert.equal(consumeTurnsRes.mode, 'turns');

// Now turns are 0, quota exceeded again
const statusAfterConsume = getAiAccessStatus(memLocal, memSession);
assert.equal(statusAfterConsume.allowed, false);

// Purchase Day Pass (10k)
const res10k = purchaseAiPackage('ai_day_pass', 'instant', { storage: memLocal });
assert.equal(res10k.success, true);
assert.equal(res10k.package.price, 10000);

const statusDayPass = getAiAccessStatus(memLocal, memSession);
assert.equal(statusDayPass.allowed, true);
assert.equal(statusDayPass.mode, 'unlimited');
assert.ok(statusDayPass.expiresAt > Date.now());

// Consume with Day pass - does not decrement turns
const consumeDayRes = consumeAiTryOn(memLocal, memSession);
assert.equal(consumeDayRes.success, true);
assert.equal(consumeDayRes.mode, 'unlimited');

// Purchase Month Pass (50k)
const res50k = purchaseAiPackage('ai_month_pass', 'instant', { storage: memLocal });
assert.equal(res50k.success, true);
assert.equal(res50k.package.price, 50000);

const statusMonthPass = getAiAccessStatus(memLocal, memSession);
assert.equal(statusMonthPass.allowed, true);
assert.equal(statusMonthPass.mode, 'unlimited');

// -------------------------------------------------------------
// Test 3: Google Analytics utility
// -------------------------------------------------------------
const gaId = getGaMeasurementId();
assert.ok(typeof gaId === 'string' && gaId.length > 0, 'GA measurement ID should be defined');
// Ensure calling trackPageView / trackEvent doesn't crash in node or browser
trackPageView('/test-path', 'Test Title');
trackEvent('test_event', { key: 'value' });

// -------------------------------------------------------------
// Test 4: Visit Tracker & Traffic Analytics
// -------------------------------------------------------------
if (!globalThis.window) {
  globalThis.window = {
    location: { pathname: '/shop', href: 'http://localhost/shop' },
  };
}
if (!globalThis.document) {
  globalThis.document = {
    title: 'DoRentMe Shop',
    dispatchEvent: () => true,
    querySelector: () => null,
    head: { appendChild: () => {} },
  };
}

const analytics = getTrafficAnalytics();
assert.ok(analytics.totalVisits > 0, 'Should have visit statistics');
assert.ok(analytics.trend.length === 7, 'Trend must be 7 days');
assert.ok(Array.isArray(analytics.topPages), 'Top pages must be an array');
assert.ok(Array.isArray(analytics.deviceBreakdown), 'Device breakdown must be an array');

recordVisit('/ai-tryon', 'Thử Đồ AI');
recordAiTryOnEvent();
const updatedAnalytics = getTrafficAnalytics();
assert.ok(updatedAnalytics.aiTryOnTotal >= analytics.aiTryOnTotal);

console.log('AI Packages & Analytics validation PASS');
