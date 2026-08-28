const GENERIC_CHAT_ERROR = 'Không nhận được phản hồi phù hợp từ AI. Vui lòng thử lại.';

export function getApiErrorMessage(data, fallback = GENERIC_CHAT_ERROR) {
  const error = data?.error;
  if (typeof error === 'string' && error.trim()) return error;
  if (typeof error?.message === 'string' && error.message.trim()) return error.message;
  if (typeof data?.message === 'string' && data.message.trim()) return data.message;
  return fallback;
}

export function extractGeminiCandidateText(data) {
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return typeof text === 'string' ? text : '';
}

export function parseAssistantPayload(rawText) {
  const fallbackText = typeof rawText === 'string' ? rawText : '';

  if (!fallbackText.trim()) {
    return {
      reply: GENERIC_CHAT_ERROR,
      recommendedProducts: [],
      parsed: false,
    };
  }

  try {
    const parsed = JSON.parse(fallbackText);
    const reply = typeof parsed?.reply === 'string' && parsed.reply.trim() ? parsed.reply : fallbackText;
    const recommendedProducts = Array.isArray(parsed?.recommendedProducts)
      ? parsed.recommendedProducts
          .filter((name) => typeof name === 'string' || typeof name === 'number')
          .map((name) => String(name).trim())
          .filter(Boolean)
      : [];

    return {
      reply,
      recommendedProducts,
      parsed: true,
    };
  } catch {
    return {
      reply: fallbackText,
      recommendedProducts: [],
      parsed: false,
    };
  }
}

export function resolveRecommendedProducts(productNames, catalog) {
  if (!Array.isArray(productNames)) return [];

  return productNames
    .map((name) => {
      if (typeof name !== 'string' && typeof name !== 'number') return null;
      const rawName = String(name);
      const target = rawName.trim().toLowerCase();
      return catalog.find((product) => product.name === rawName) || catalog.find((product) => product.name.trim().toLowerCase() === target) || null;
    })
    .filter(Boolean);
}
