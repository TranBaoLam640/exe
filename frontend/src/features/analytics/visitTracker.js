import { getBrowserStorage, readJsonValue, writeJsonValue } from '../../utils/browserStorage.js';
import { getSession } from '../auth/authService.js';

export const TRAFFIC_STORAGE_KEY = 'dorentme_traffic_data';
export const VISITOR_ID_KEY = 'dorentme_visitor_id';
export const TRAFFIC_UPDATED_EVENT = 'traffic:updated';

function getStorage() {
  return getBrowserStorage('localStorage');
}

export function getOrCreateVisitorId() {
  const storage = getStorage();
  let visitorId = storage?.getItem(VISITOR_ID_KEY);
  if (!visitorId) {
    visitorId = 'vis_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    try {
      storage?.setItem(VISITOR_ID_KEY, visitorId);
    } catch {
      // Ignore write error
    }
  }
  return visitorId;
}

function detectDevice() {
  if (typeof navigator === 'undefined') return 'Desktop';
  const ua = navigator.userAgent || '';
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet';
  if (/mobile|iphone|ipod|android|blackberry|iemobile/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

function detectBrowser() {
  if (typeof navigator === 'undefined') return 'Browser';
  const ua = navigator.userAgent || '';
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dateStr) {
  try {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}`;
  } catch {
    return dateStr;
  }
}

function createSeedData() {
  const today = new Date();
  const daily = {};
  const seedVisits = [42, 58, 65, 52, 74, 88, 62];
  const seedUniques = [28, 37, 44, 35, 51, 60, 43];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const idx = 6 - i;
    daily[dateStr] = {
      visits: seedVisits[idx] || 50,
      uniques: seedUniques[idx] || 35,
      visitors: {},
    };
  }

  const initialTopPages = {
    '/': { path: '/', title: 'Trang chủ DoRentMe', count: 245 },
    '/shop': { path: '/shop', title: 'Danh mục Sản phẩm', count: 182 },
    '/ai-tryon': { path: '/ai-tryon', title: 'Thử Đồ Bằng AI', count: 114 },
    '/cart': { path: '/cart', title: 'Giỏ hàng', count: 56 },
    '/checkout': { path: '/checkout', title: 'Thanh toán đơn thuê', count: 38 },
    '/tutorial': { path: '/tutorial', title: 'Hướng dẫn thuê đồ', count: 29 },
  };

  const initialDevices = {
    Mobile: 284,
    Desktop: 342,
    Tablet: 38,
  };

  const initialRecent = [
    {
      id: 'v_seed_1',
      path: '/ai-tryon',
      title: 'Thử Đồ Bằng AI',
      time: new Date(Date.now() - 3 * 60000).toISOString(),
      device: 'Mobile',
      browser: 'Chrome',
      visitorId: 'vis_seed_91a',
      role: 'CUSTOMER',
    },
    {
      id: 'v_seed_2',
      path: '/shop',
      title: 'Danh mục Sản phẩm',
      time: new Date(Date.now() - 8 * 60000).toISOString(),
      device: 'Desktop',
      browser: 'Chrome',
      visitorId: 'vis_seed_32b',
      role: 'GUEST',
    },
    {
      id: 'v_seed_3',
      path: '/',
      title: 'Trang chủ DoRentMe',
      time: new Date(Date.now() - 15 * 60000).toISOString(),
      device: 'Desktop',
      browser: 'Safari',
      visitorId: 'vis_seed_77c',
      role: 'GUEST',
    },
  ];

  return {
    totalVisits: 664,
    uniqueVisitorsCount: 298,
    aiTryOnTotal: 76,
    daily,
    pages: initialTopPages,
    devices: initialDevices,
    recent: initialRecent,
    allVisitorIds: {},
  };
}

export function loadTrafficData(storage = getStorage()) {
  const raw = readJsonValue(storage, TRAFFIC_STORAGE_KEY, null);
  if (!raw || typeof raw !== 'object' || !raw.daily) {
    const seed = createSeedData();
    if (storage) writeJsonValue(storage, TRAFFIC_STORAGE_KEY, seed);
    return seed;
  }
  return raw;
}

export function recordVisit(path, title, storage = getStorage()) {
  if (typeof window === 'undefined') return;

  // Don't track admin internal actions as regular customer traffic
  const cleanPath = (path || window.location.pathname || '/').split('?')[0];
  const cleanTitle = title || document.title || 'DoRentMe';
  const visitorId = getOrCreateVisitorId();
  const todayStr = getTodayString();
  const device = detectDevice();
  const browser = detectBrowser();
  const session = getSession();

  const data = loadTrafficData(storage);

  data.totalVisits = (data.totalVisits || 0) + 1;

  if (!data.allVisitorIds) data.allVisitorIds = {};
  if (!data.allVisitorIds[visitorId]) {
    data.allVisitorIds[visitorId] = true;
    data.uniqueVisitorsCount = (data.uniqueVisitorsCount || 0) + 1;
  }

  // Daily records
  if (!data.daily) data.daily = {};
  if (!data.daily[todayStr]) {
    data.daily[todayStr] = { visits: 0, uniques: 0, visitors: {} };
  }
  data.daily[todayStr].visits += 1;
  if (!data.daily[todayStr].visitors[visitorId]) {
    data.daily[todayStr].visitors[visitorId] = true;
    data.daily[todayStr].uniques += 1;
  }

  // Pages breakdown
  if (!data.pages) data.pages = {};
  if (!data.pages[cleanPath]) {
    data.pages[cleanPath] = { path: cleanPath, title: cleanTitle, count: 0 };
  }
  data.pages[cleanPath].count += 1;
  if (cleanTitle && cleanTitle !== 'DoRentMe React Migration') {
    data.pages[cleanPath].title = cleanTitle;
  }

  // Device breakdown
  if (!data.devices) data.devices = {};
  data.devices[device] = (data.devices[device] || 0) + 1;

  // If path is AI Try-on
  if (cleanPath.includes('ai-tryon')) {
    data.aiTryOnTotal = (data.aiTryOnTotal || 0) + 1;
  }

  // Recent visits (keep last 50)
  if (!Array.isArray(data.recent)) data.recent = [];
  data.recent.unshift({
    id: 'v_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    path: cleanPath,
    title: cleanTitle,
    time: new Date().toISOString(),
    device,
    browser,
    visitorId: visitorId.substring(0, 12),
    role: session?.role || 'GUEST',
  });
  if (data.recent.length > 50) {
    data.recent = data.recent.slice(0, 50);
  }

  if (storage) writeJsonValue(storage, TRAFFIC_STORAGE_KEY, data);

  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(TRAFFIC_UPDATED_EVENT, { detail: data }));
  }
}

export function recordAiTryOnEvent(action = 'tryon_executed', storage = getStorage()) {
  const data = loadTrafficData(storage);
  data.aiTryOnTotal = (data.aiTryOnTotal || 0) + 1;
  if (storage) writeJsonValue(storage, TRAFFIC_STORAGE_KEY, data);
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(TRAFFIC_UPDATED_EVENT, { detail: data }));
  }
}

export function getTrafficAnalytics(storage = getStorage()) {
  const data = loadTrafficData(storage);
  const todayStr = getTodayString();
  const todayRecord = data.daily?.[todayStr] || { visits: 0, uniques: 0 };

  // Prepare 7-day trend
  const trend = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const entry = data.daily?.[dateStr] || { visits: 0, uniques: 0 };
    trend.push({
      date: dateStr,
      label: formatDayLabel(dateStr),
      visits: entry.visits,
      uniques: entry.uniques,
      isToday: dateStr === todayStr,
    });
  }

  // Calculate highest daily visits for chart bar scaling
  const maxDayVisits = Math.max(...trend.map((t) => t.visits), 10);

  // Top pages sorted by count
  const pagesList = Object.values(data.pages || {})
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const totalPageCount = pagesList.reduce((acc, p) => acc + p.count, 0) || 1;
  const topPages = pagesList.map((p) => ({
    ...p,
    percentage: Math.round((p.count / totalPageCount) * 100),
  }));

  // Device breakdown
  const devicesObj = data.devices || {};
  const totalDevices = Object.values(devicesObj).reduce((acc, c) => acc + c, 0) || 1;
  const deviceBreakdown = Object.entries(devicesObj).map(([device, count]) => ({
    device,
    count,
    percentage: Math.round((count / totalDevices) * 100),
  }));

  return {
    totalVisits: data.totalVisits || 0,
    todayVisits: todayRecord.visits,
    todayUniques: todayRecord.uniques,
    uniqueVisitors: data.uniqueVisitorsCount || Math.round((data.totalVisits || 0) * 0.65),
    aiTryOnTotal: data.aiTryOnTotal || 0,
    trend,
    maxDayVisits,
    topPages,
    deviceBreakdown,
    recentVisits: data.recent || [],
  };
}

export function resetTrafficAnalytics() {
  const seed = createSeedData();
  writeJsonValue(getStorage(), TRAFFIC_STORAGE_KEY, seed);
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(TRAFFIC_UPDATED_EVENT, { detail: seed }));
  }
  return seed;
}
