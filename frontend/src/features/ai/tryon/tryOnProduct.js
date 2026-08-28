export function buildTryOnProductUrl(product) {
  if (!product?.id) {
    const params = new URLSearchParams();
    ['name', 'image', 'category', 'price3day', 'priceExtra', 'price1day', 'priceTag', 'priceDeposit'].forEach((key) => {
      if (product?.[key]) params.set(key, product[key]);
    });
    return `/ai-tryon?${params.toString()}`;
  }

  return `/ai-tryon?product=${encodeURIComponent(product.id)}`;
}

export function legacyProductFromParams(params) {
  if (!params.get('name')) return null;

  return {
    id: '',
    name: params.get('name'),
    image: params.get('image') || '',
    category: params.get('category') || '',
    categoryLabel: params.get('category') || '',
    price3day: params.get('price3day') || '',
    priceExtra: params.get('priceExtra') || '',
    price1day: params.get('price1day') || '',
    priceTag: params.get('priceTag') || '',
    priceDeposit: params.get('priceDeposit') || '',
  };
}

export function resolveTryOnProduct(params, catalog) {
  const productId = params.get('product');
  if (productId) {
    const product = catalog.find((candidate) => candidate.id === productId);
    if (product) return { product, source: 'react-id' };
  }

  const legacyProduct = legacyProductFromParams(params);
  if (legacyProduct) return { product: legacyProduct, source: 'legacy-query' };

  return { product: null, source: 'none' };
}

export function isExternalHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getProviderGarmentUrl(product, makeImageUrl) {
  const url = makeImageUrl(product?.image || '');
  if (!isExternalHttpUrl(url)) {
    throw new Error('Ảnh sản phẩm chưa có URL công khai để gửi tới AI. Vui lòng thử lại sau.');
  }
  return url;
}
