const rawAssetBaseUrl = import.meta.env?.VITE_ASSET_BASE_URL || '';

function isAbsoluteUrl(value) {
  return /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(value);
}

export function joinAssetUrl(baseUrl, key) {
  const rawKey = String(key || '');

  if (isAbsoluteUrl(rawKey)) {
    return rawKey;
  }

  const normalizedKey = rawKey.replace(/^\/+/, '');
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');

  if (!normalizedBase) {
    return normalizedKey ? `/${normalizedKey}` : '/';
  }

  return normalizedKey ? `${normalizedBase}/${normalizedKey}` : normalizedBase;
}

export function assetUrl(key) {
  return joinAssetUrl(rawAssetBaseUrl, key);
}
