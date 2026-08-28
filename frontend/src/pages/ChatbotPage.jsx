import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { imageUrl } from '../assets/imageUrl.js';
import { CHAT_GENERATION_CONFIG, buildSystemPrompt } from '../features/ai/chat/chatPrompt.js';
import { extractGeminiCandidateText, getApiErrorMessage, parseAssistantPayload, resolveRecommendedProducts } from '../features/ai/chat/chatResponse.js';
import { sendChatMessage } from '../features/ai/chat/chatService.js';
import { getProducts } from '../features/catalog/services/catalogService.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

const quickPrompts = [
  'Gợi ý outfit đi tiệc cưới cho tôi',
  'Tôi cao 1m60, nên thuê váy gì?',
  'Phối đồ đi biển mùa hè cần gì?',
  'Outfit công sở thanh lịch cho nữ',
  'Giá thuê đồ ở DoRentMe như thế nào?',
];

const welcomePrompts = [
  'Outfit đi tiệc cưới',
  'Đồ đi biển mùa hè',
  'Trang phục công sở',
  'Trang phục hóa trang',
  'Váy dự tiệc sang trọng',
  'Outfit chụp ảnh kỷ yếu',
];

const formatTime = () => new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

function MessageText({ text }) {
  return String(text || '')
    .split('\n')
    .map((line, index) => (
      <span key={`${line}-${index}`}>
        {line}
        {index < String(text || '').split('\n').length - 1 ? <br /> : null}
      </span>
    ));
}

function RecommendationCards({ products }) {
  if (!products.length) return null;

  return (
    <div className="chatbot-product-cards-row">
      {products.map((product, index) => (
        <Link className="chatbot-product-card" to={`/product/${product.id}`} key={`${product.id}-${index}`}>
          <img src={imageUrl(product.image)} alt={product.name} />
          <div className="chatbot-product-card-info">
            <div className="chatbot-product-card-name">{product.name}</div>
            <div className="chatbot-product-card-price">Thuê 3 ngày: {product.price3day}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function ChatMessage({ message }) {
  const isAi = message.role === 'ai';
  return (
    <div className={`chatbot-msg ${message.role}`}>
      <div className="chatbot-msg-avatar" aria-hidden="true">
        {isAi ? 'AI' : 'Me'}
      </div>
      <div>
        <div className="chatbot-msg-bubble">
          <MessageText text={message.text} />
        </div>
        {isAi ? <RecommendationCards products={message.products || []} /> : null}
        <div className="chatbot-msg-time">{message.time}</div>
      </div>
    </div>
  );
}

function WelcomeScreen({ onPrompt }) {
  return (
    <div className="chatbot-welcome-screen">
      <div className="chatbot-welcome-icon" aria-hidden="true">AI</div>
      <h1>Xin chào! Tôi là DoStyle AI</h1>
      <p>Trợ lý thời trang thông minh của DoRentMe. Tôi có thể giúp bạn tư vấn phối đồ, gợi ý trang phục thuê phù hợp với từng dịp, vóc dáng và phong cách cá nhân.</p>
      <div className="chatbot-quick-chips">
        {welcomePrompts.map((prompt) => (
          <button className="chatbot-chip" type="button" onClick={() => onPrompt(prompt)} key={prompt}>
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="chatbot-msg ai" aria-live="polite" aria-label="DoStyle AI đang trả lời">
      <div className="chatbot-msg-avatar" aria-hidden="true">AI</div>
      <div className="chatbot-typing-bubble">
        <span className="chatbot-typing-dot" />
        <span className="chatbot-typing-dot" />
        <span className="chatbot-typing-dot" />
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  useDocumentTitle('AI Phối Đồ | DoRentMe');
  const catalog = useMemo(() => getProducts(), []);
  const systemPrompt = useMemo(() => buildSystemPrompt(catalog), [catalog]);
  const [messages, setMessages] = useState([]);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  useEffect(() => () => abortRef.current?.abort(), []);

  function resetInputHeight() {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
  }

  function updateInput(value) {
    setInput(value);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    });
  }

  function appendMessage(message) {
    setMessages((current) => [...current, { id: `${Date.now()}-${current.length}`, time: formatTime(), ...message }]);
  }

  async function sendMessage(textOverride) {
    const text = String(textOverride ?? input).trim();
    if (!text || isSending) return;

    const userContent = { role: 'user', parts: [{ text }] };
    const nextHistory = [...conversationHistory, userContent];
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;

    setIsSending(true);
    setInput('');
    resetInputHeight();
    appendMessage({ role: 'user', text });
    setConversationHistory(nextHistory);

    try {
      const data = await sendChatMessage(
        {
          messages: nextHistory,
          system: systemPrompt,
          generationConfig: CHAT_GENERATION_CONFIG,
        },
        { signal: controller.signal },
      );

      const rawText = extractGeminiCandidateText(data);
      if (!rawText) {
        throw new Error(getApiErrorMessage(data));
      }

      const parsed = parseAssistantPayload(rawText);
      const products = resolveRecommendedProducts(parsed.recommendedProducts, catalog);
      setConversationHistory((current) => [...current, { role: 'model', parts: [{ text: rawText }] }]);
      appendMessage({ role: 'ai', text: parsed.reply, products });
    } catch (error) {
      if (error?.name === 'AbortError') return;
      appendMessage({ role: 'ai', text: error?.message || 'Không kết nối được với AI. Kiểm tra lại kết nối mạng.', products: [] });
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsSending(false);
      inputRef.current?.focus();
    }
  }

  function newChat() {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setConversationHistory([]);
    setIsSending(false);
    setInput('');
    resetInputHeight();
    inputRef.current?.focus();
  }

  function onKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="chatbot-page">
      <div className="chatbot-layout">
        <aside className="chatbot-sidebar" aria-label="Gợi ý nhanh">
          <div className="chatbot-sidebar-title">DoStyle AI</div>
          <button className="chatbot-new-chat-btn" type="button" onClick={newChat}>
            <span aria-hidden="true">+</span>
            <span>Cuộc trò chuyện mới</span>
          </button>
          <div className="chatbot-suggest-title">Gợi ý nhanh</div>
          {quickPrompts.map((prompt) => (
            <button className="chatbot-suggest-btn" type="button" onClick={() => sendMessage(prompt)} disabled={isSending} key={prompt}>
              {prompt}
            </button>
          ))}
          <div className="chatbot-sidebar-footer">
            <p>Powered by <span>Gemini AI</span><br />Tư vấn thời trang 24/7</p>
          </div>
        </aside>

        <section className="chatbot-area" aria-label="DoStyle AI chat">
          <div className="chatbot-header">
            <div className="chatbot-ai-avatar" aria-hidden="true">AI</div>
            <div className="chatbot-ai-info">
              <h2>DoStyle AI</h2>
              <div className="chatbot-ai-status">
                <span className="chatbot-status-dot" aria-hidden="true" />
                <p>Trợ lý thời trang AI của DoRentMe</p>
              </div>
            </div>
          </div>

          <div className="chatbot-messages" ref={messagesRef}>
            {messages.length === 0 ? <WelcomeScreen onPrompt={sendMessage} /> : null}
            {messages.map((message) => <ChatMessage message={message} key={message.id} />)}
            {isSending ? <TypingIndicator /> : null}
          </div>

          <form
            className="chatbot-input-area"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <label className="sr-only" htmlFor="chatbot-user-input">Nhập câu hỏi thời trang</label>
            <div className="chatbot-input-wrap">
              <textarea
                id="chatbot-user-input"
                ref={inputRef}
                value={input}
                onChange={(event) => updateInput(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Nhập câu hỏi về thời trang..."
                rows="1"
              />
              <button className="chatbot-send-btn" type="submit" disabled={isSending || !input.trim()} aria-label="Gửi tin nhắn">
                Send
              </button>
            </div>
            <div className="chatbot-input-hint">Enter để gửi · Shift+Enter xuống dòng · DoStyle AI có thể mắc lỗi</div>
          </form>
        </section>
      </div>
    </div>
  );
}
