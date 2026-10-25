/**
 * Google OAuth 2.0 / Google Identity Services (GIS) Helper
 * Manages Google Sign-In script loading, JWT decoding, and OAuth authentication flow.
 */

const DEFAULT_GOOGLE_CLIENT_ID = '1058284729182-demo.apps.googleusercontent.com';

/**
 * Get configured Google OAuth Client ID
 */
export function getGoogleClientId() {
  const envId = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID;
  return (envId && envId.trim()) || DEFAULT_GOOGLE_CLIENT_ID;
}

/**
 * Safely parse a Google ID Token (JWT) into user profile payload
 * @param {string} token - Raw JWT string from Google Identity Services
 * @returns {object|null}
 */
export function parseGoogleJwt(token) {
  if (!token || typeof token !== 'string') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Polyfill or browser atob support
    const jsonPayload = decodeURIComponent(
      (typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary'))
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.warn('[Google OAuth] Failed to decode JWT credential:', error);
    return null;
  }
}

/**
 * Load Google Identity Services script dynamically
 * @returns {Promise<boolean>}
 */
export function loadGoogleIdentityScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return Promise.resolve(false);
  }

  // Already loaded
  if (window.google?.accounts?.id) {
    return Promise.resolve(true);
  }

  const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
  if (existingScript) {
    return new Promise((resolve) => {
      existingScript.addEventListener('load', () => resolve(true), { once: true });
      existingScript.addEventListener('error', () => resolve(false), { once: true });
    });
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.warn('[Google OAuth] Could not load Google Identity Services script.');
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize Google Identity Services button and callback
 * @param {object} options
 * @param {string} [options.clientId]
 * @param {function} options.onCredential - Callback called with Google JWT credential
 * @param {HTMLElement} [options.buttonElement] - DOM element to render official button into
 * @param {boolean} [options.promptOneTap=false]
 */
export function initGoogleIdentityServices({
  clientId = getGoogleClientId(),
  onCredential,
  buttonElement,
  promptOneTap = false,
}) {
  if (typeof window === 'undefined' || !window.google?.accounts?.id) {
    return false;
  }

  try {
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential && typeof onCredential === 'function') {
          onCredential(response.credential);
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    if (buttonElement) {
      window.google.accounts.id.renderButton(buttonElement, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'signin_with',
        size: 'large',
        logo_alignment: 'left',
        width: buttonElement.offsetWidth || 350,
        locale: 'vi',
      });
    }

    if (promptOneTap) {
      window.google.accounts.id.prompt();
    }

    return true;
  } catch (error) {
    console.warn('[Google OAuth] Error initializing Google Identity Services:', error);
    return false;
  }
}
