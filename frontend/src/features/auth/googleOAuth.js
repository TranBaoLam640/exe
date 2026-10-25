/**
 * Google OAuth 2.0 / Google Identity Services (GIS) Helper
 * Manages Google Sign-In script loading, JWT decoding, and OAuth authentication flow.
 */



/**
 * Get configured Google OAuth Client ID
 */
export function getGoogleClientId() {
  const envId = typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID;
  const clientId = (typeof envId === 'string' && envId.trim()) || '356052637766-9tl1crog9a91769chl1f109uil8cagck.apps.googleusercontent.com';
  return /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/i.test(clientId) && !clientId.includes('-demo.') ? clientId : '';
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
let identityScriptPromise;

export function loadGoogleIdentityScript() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return Promise.resolve(false);
  if (window.google?.accounts?.id) return Promise.resolve(true);
  if (identityScriptPromise) return identityScriptPromise;

  identityScriptPromise = new Promise((resolve) => {
    let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    const existing = Boolean(script);
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client?hl=vi';
      script.async = true;
      script.defer = true;
    }
    const finish = (loaded) => {
      clearTimeout(timer);
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
      if (!loaded) {
        script.remove();
        identityScriptPromise = undefined;
      }
      resolve(loaded);
    };
    const onLoad = () => finish(Boolean(window.google?.accounts?.id));
    const onError = () => finish(false);
    const timer = setTimeout(() => finish(false), 15000);
    script.addEventListener('load', onLoad, { once: true });
    script.addEventListener('error', onError, { once: true });
    if (!existing) document.head.appendChild(script);
  });
  return identityScriptPromise;
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
  buttonText = 'signin_with',
}) {
  if (!clientId || typeof window === 'undefined' || !window.google?.accounts?.id) {
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
        text: buttonText,
        size: 'large',
        logo_alignment: 'left',
        width: Math.min(400, buttonElement.offsetWidth || 350),
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
