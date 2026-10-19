import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../utils/analytics.js';
import { recordVisit } from '../../features/analytics/visitTracker.js';

/**
 * AnalyticsTracker component:
 * Mounts in AppLayout to automatically capture route changes
 * and sends page views to both Google Analytics and the internal visit logger.
 */
export default function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    const fullPath = location.pathname + location.search;
    // Delay slightly to let document.title update from useDocumentTitle
    const timer = setTimeout(() => {
      const pageTitle = document.title || 'DoRentMe';
      trackPageView(fullPath, pageTitle);
      recordVisit(fullPath, pageTitle);
    }, 100);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
