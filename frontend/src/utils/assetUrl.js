const rawAssetBaseUrl = import.meta.env?.VITE_ASSET_BASE_URL || '';

export function joinAssetUrl(baseUrl, key) {
  const normalizedKey = String(key || '').replace(/^\/+/, '');
  const normalizedBase = String(baseUrl || '').replace(/\/+$/, '');

  if (!normalizedBase) {
    return normalizedKey ? `/${normalizedKey}` : '/';
  }

  return normalizedKey ? `${normalizedBase}/${normalizedKey}` : normalizedBase;
}

export function assetUrl(key) {
  return joinAssetUrl(rawAssetBaseUrl, key);
}
