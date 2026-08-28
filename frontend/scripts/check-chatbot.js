import assert from 'node:assert/strict';
import { CHAT_GENERATION_CONFIG, buildCatalogText, buildSystemPrompt } from '../src/features/ai/chat/chatPrompt.js';
import { extractGeminiCandidateText, getApiErrorMessage, parseAssistantPayload, resolveRecommendedProducts } from '../src/features/ai/chat/chatResponse.js';
import { CHAT_API_URL, sendChatMessage } from '../src/features/ai/chat/chatService.js';
import { products } from '../src/features/catalog/data/products.js';

const sampleProduct = products[0];

assert.equal(CHAT_API_URL, '/api/chat');
assert.equal(CHAT_GENERATION_CONFIG.responseMimeType, 'application/json');
assert.deepEqual(CHAT_GENERATION_CONFIG.responseSchema.required, ['reply', 'recommendedProducts']);

const catalogText = buildCatalogText(products);
assert.ok(catalogText.includes(sampleProduct.name));
assert.ok(catalogText.includes(sampleProduct.price3day));

const systemPrompt = buildSystemPrompt(products);
assert.ok(systemPrompt.includes('=== DANH MỤC SẢN PHẨM ==='));
assert.ok(systemPrompt.includes(sampleProduct.name));
assert.ok(!systemPrompt.includes('GEMINI_API_KEY'));
assert.ok(!systemPrompt.includes('FASHN_API_KEY'));

const rawModelText = JSON.stringify({ reply: 'Xin chào\\nBạn cần outfit nào?', recommendedProducts: [sampleProduct.name] });
assert.equal(extractGeminiCandidateText({ candidates: [{ content: { parts: [{ text: rawModelText }] } }] }), rawModelText);
assert.equal(extractGeminiCandidateText({ candidates: [] }), '');

const parsed = parseAssistantPayload(rawModelText);
assert.equal(parsed.reply, 'Xin chào\\nBạn cần outfit nào?');
assert.deepEqual(parsed.recommendedProducts, [sampleProduct.name]);

const invalidJson = parseAssistantPayload('Một phản hồi thường');
assert.equal(invalidJson.reply, 'Một phản hồi thường');
assert.deepEqual(invalidJson.recommendedProducts, []);

assert.equal(getApiErrorMessage({ error: { message: 'Nested' } }), 'Nested');
assert.equal(getApiErrorMessage({ error: 'String error' }), 'String error');

const duplicateName = 'TIPBLU – ĐẦM VOAN TÍM LAVENDER';
const duplicateMatches = products.filter((product) => product.name === duplicateName);
assert.ok(duplicateMatches.length > 1);
assert.equal(resolveRecommendedProducts([duplicateName], products)[0], duplicateMatches[0]);
assert.deepEqual(resolveRecommendedProducts(['missing product'], products), []);

let fetchPayload;
const successData = { candidates: [{ content: { parts: [{ text: rawModelText }] } }] };
const successResponse = await sendChatMessage(
  { messages: [{ role: 'user', parts: [{ text: 'Hello' }] }], system: 'system', generationConfig: CHAT_GENERATION_CONFIG },
  {
    fetcher: async (url, options) => {
      fetchPayload = { url, options };
      return {
        ok: true,
        json: async () => successData,
      };
    },
  },
);

assert.deepEqual(successResponse, successData);
assert.equal(fetchPayload.url, '/api/chat');
assert.equal(fetchPayload.options.method, 'POST');
assert.equal(fetchPayload.options.headers['Content-Type'], 'application/json');
const sentBody = JSON.parse(fetchPayload.options.body);
assert.equal(sentBody.messages[0].role, 'user');
assert.equal(sentBody.system, 'system');
assert.equal(sentBody.generationConfig.responseMimeType, 'application/json');

await assert.rejects(
  () =>
    sendChatMessage(
      { messages: [], system: 'system', generationConfig: CHAT_GENERATION_CONFIG },
      {
        fetcher: async () => ({
          ok: false,
          json: async () => ({ error: { message: 'Nested failure' } }),
        }),
      },
    ),
  /Nested failure/,
);

await assert.rejects(
  () =>
    sendChatMessage(
      { messages: [], system: 'system', generationConfig: CHAT_GENERATION_CONFIG },
      {
        fetcher: async () => ({
          ok: false,
          json: async () => ({ error: 'String failure' }),
        }),
      },
    ),
  /String failure/,
);

const abortController = new AbortController();
let observedSignal;
await sendChatMessage(
  { messages: [], system: 'system', generationConfig: CHAT_GENERATION_CONFIG },
  {
    signal: abortController.signal,
    fetcher: async (url, options) => {
      observedSignal = options.signal;
      return {
        ok: true,
        json: async () => successData,
      };
    },
  },
);
assert.equal(observedSignal, abortController.signal);

console.log('Chatbot validation passed');
