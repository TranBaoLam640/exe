import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(dirname, '..');

function loadRootLocalEnv() {
  const envPath = path.join(repoRoot, '.env.local');
  if (!fs.existsSync(envPath)) return;

  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split(/\r?\n/).forEach((line) => {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) return;

    const [, name, rawValue] = match;
    if (process.env[name]) return;

    process.env[name] = rawValue.replace(/^['"]|['"]$/g, '');
  });
}

function sendJson(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }

  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody.trim()) return {};
  return JSON.parse(rawBody);
}

async function handleLocalChat(req, res) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  if (!process.env.GEMINI_API_KEY) {
    sendJson(res, 500, { error: { message: 'GEMINI_API_KEY chua duoc cau hinh trong .env.local' } });
    return;
  }

  const { messages, system, generationConfig } = await readJsonBody(req);
  if (!messages || !system) {
    sendJson(res, 400, { error: 'Missing messages or system prompt' });
    return;
  }

  const body = {
    system_instruction: { parts: [{ text: system }] },
    contents: messages,
  };
  if (generationConfig) body.generationConfig = generationConfig;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );
  const data = await response.json();
  sendJson(res, response.status, data);
}

async function handleLocalTryOn(req, res, url) {
  if (!process.env.FASHN_API_KEY) {
    sendJson(res, 500, { error: { message: 'FASHN_API_KEY chua duoc cau hinh trong .env.local' } });
    return;
  }

  const fashnBase = 'https://api.fashn.ai/v1';
  const authHeader = { Authorization: `Bearer ${process.env.FASHN_API_KEY}` };

  if (req.method === 'POST') {
    const { humanImage, garmentImageUrl } = await readJsonBody(req);
    if (!humanImage || !garmentImageUrl) {
      sendJson(res, 400, { error: { message: 'Thieu anh khach hang hoac anh san pham' } });
      return;
    }

    const response = await fetch(`${fashnBase}/run`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model_name: 'tryon-max',
        inputs: {
          model_image: humanImage,
          product_image: garmentImageUrl,
          resolution: '1k',
        },
      }),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
      sendJson(res, response.ok ? 400 : response.status, {
        error: { message: data.error || 'Khong gui duoc yeu cau toi FASHN AI.' },
      });
      return;
    }

    sendJson(res, 200, { requestId: data.id });
    return;
  }

  if (req.method === 'GET') {
    const requestId = url.searchParams.get('id');
    if (!requestId) {
      sendJson(res, 400, { error: { message: 'Thieu request id' } });
      return;
    }

    const response = await fetch(`${fashnBase}/status/${requestId}`, { headers: authHeader });
    const data = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, { error: { message: data.error || 'Khong kiem tra duoc trang thai xu ly.' } });
      return;
    }
    if (data.error) {
      sendJson(res, 400, { error: { message: data.error } });
      return;
    }

    const statusMap = {
      starting: 'IN_QUEUE',
      in_queue: 'IN_QUEUE',
      processing: 'IN_PROGRESS',
      completed: 'COMPLETED',
      failed: 'FAILED',
    };
    const normalized = { status: statusMap[data.status] || data.status };
    if (data.status === 'completed' && Array.isArray(data.output) && data.output[0]) {
      normalized.image = { url: data.output[0] };
    }
    sendJson(res, 200, normalized);
    return;
  }

  sendJson(res, 405, { error: 'Method not allowed' });
}

function localAiApiPlugin() {
  return {
    name: 'local-ai-api',
    configureServer(server) {
      loadRootLocalEnv();

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost');
        if (url.pathname !== '/api/chat' && url.pathname !== '/api/tryon') {
          next();
          return;
        }

        try {
          if (url.pathname === '/api/chat') {
            await handleLocalChat(req, res);
            return;
          }

          await handleLocalTryOn(req, res, url);
        } catch (error) {
          sendJson(res, 500, { error: { message: `Local AI API error: ${error.message}` } });
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), localAiApiPlugin()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
