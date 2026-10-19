/**
 * Google Analytics 4 (GA4) Integration Helper
 * Provides automatic pageview tracking, custom event dispatching, and graceful fallbacks.
 */

const DEFAULT_MEASUREMENT_ID = 'G-DORENTME01';

export function getGaMeasurementId() {
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID) || DEFAULT_MEASUREMENT_ID;
}

let isInitialized = false;

/**
 * Initialize Google Analytics tag dynamically
 */
export function initGoogleAnalytics(measurementId = getGaMeasurementId()) {
  if (typeof window === 'undefined') return;
  if (isInitialized) return;

  try {
    // Check if script tag already exists
    const existingScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      document.head.appendChild(script);
    }

    // Set up dataLayer and gtag function
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      window.gtag('js', new Date());
      window.gtag('config', measurementId, {
        send_page_view: false, // We handle page views manually on route changes in React SPA
      });
    }

    isInitialized = true;
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.info(`[Google Analytics] Initialized with ID: ${measurementId}`);
    }
  } catch (error) {
    console.warn('[Google Analytics] Failed to initialize:', error);
  }
}

/**
 * Track a page view in Google Analytics
 */
export function trackPageView(path = window.location.pathname, title = document.title) {
  if (typeof window === 'undefined') return;

  const measurementId = getGaMeasurementId();
  initGoogleAnalytics(measurementId);

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', {
        page_path: path,
        page_title: title,
        page_location: window.location.href,
        send_to: measurementId,
      });

      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug(`[Google Analytics] Page view tracked: ${path} (${title})`);
      }
    }
  } catch (error) {
    console.warn('[Google Analytics] Pageview tracking error:', error);
  }
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(eventName, eventParams = {}) {
  if (typeof window === 'undefined') return;

  const measurementId = getGaMeasurementId();
  initGoogleAnalytics(measurementId);

  try {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, {
        ...eventParams,
        send_to: measurementId,
      });

      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.debug(`[Google Analytics] Event tracked: ${eventName}`, eventParams);
      }
    }
  } catch (error) {
    console.warn(`[Google Analytics] Event tracking error (${eventName}):`, error);
  }
}
