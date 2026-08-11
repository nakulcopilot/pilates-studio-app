// ============================================================================
// AI Proxy — Pilates Studio App
// A Supabase Edge Function that safely proxies calls to OpenRouter.
//
// SECURITY PROPERTIES
//   * The OpenRouter API key lives ONLY in the Edge Function secret store
//     (Deno.env.get('OPENROUTER_API_KEY')). It is never in the HTML/JS.
//   * Requires a valid Supabase Auth JWT in the Authorization header.
//   * Input is size-limited and shape-checked before forwarding.
//   * Best-effort per-user rate limit (isolate-local token bucket).
//   * Errors returned to the client never leak internals or secrets.
//
// Deploy:
//   supabase functions deploy ai-proxy
//   supabase secrets set OPENROUTER_API_KEY=sk-or-... OPENROUTER_MODEL=...
//
// Request body:
//   { "messages": [{role:"system"|"user", content:"..."}],
//     "model": "optional-override", "temperature": 0.4, "max_tokens": 900 }
//   Shorthand is also accepted: { "system": "...", "user": "..." }
// ============================================================================
import { createClient } from 'npm:@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? '';
const DEFAULT_MODEL = Deno.env.get('OPENROUTER_MODEL') ?? 'openai/gpt-4o-mini';

const MAX_BODY_BYTES = 16 * 1024; // 16 KB request cap
const MAX_MESSAGES = 8;
const MAX_CHARS_PER_MESSAGE = 4000;
const MAX_TOKENS = 1600;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_PER_WINDOW = 20; // requests / user / minute (best effort)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// --- best-effort per-user sliding window rate limiter -----------------------
const hits = new Map(); // key -> number[] of timestamps
function rateLimited(key, limit = RATE_LIMIT_PER_WINDOW) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);
  if (arr.length >= limit) {
    hits.set(key, arr);
    return true;
  }
  arr.push(now);
  hits.set(key, arr);
  return false;
}

function corsResponse(status, body) {
  return new Response(body, { status, headers: { ...corsHeaders, 'content-type': 'application/json' } });
}

async function verifyUser(authHeader) {
  if (!authHeader?.startsWith('Bearer ')) return { error: 'missing token' };
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return { error: 'missing token' };
  const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return { error: 'invalid token' };
  return { user: data.user };
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  if (req.method !== 'POST') return corsResponse(405, JSON.stringify({ error: 'method not allowed' }));

  // Auth gate
  const auth = await verifyUser(req.headers.get('Authorization'));
  if (auth.error) return corsResponse(401, JSON.stringify({ error: auth.error }));

  // Rate limit per user
  if (rateLimited(auth.user.id)) {
    return corsResponse(429, JSON.stringify({ error: 'rate limit exceeded, try again shortly' }));
  }

  // Input validation
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) return corsResponse(413, JSON.stringify({ error: 'payload too large' }));
  let payload;
  try {
    payload = await req.json();
  } catch {
    return corsResponse(400, JSON.stringify({ error: 'invalid json' }));
  }

  let messages;
  if (Array.isArray(payload.messages)) {
    messages = payload.messages;
  } else if (typeof payload.system === 'string' && typeof payload.user === 'string') {
    messages = [
      { role: 'system', content: payload.system },
      { role: 'user', content: payload.user },
    ];
  } else {
    return corsResponse(400, JSON.stringify({ error: 'expected { messages } or { system, user }' }));
  }

  if (messages.length > MAX_MESSAGES) return corsResponse(400, JSON.stringify({ error: 'too many messages' }));
  for (const m of messages) {
    if (!m || (m.role !== 'system' && m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') {
      return corsResponse(400, JSON.stringify({ error: 'invalid message' }));
    }
    if (m.content.length > MAX_CHARS_PER_MESSAGE) {
      return corsResponse(400, JSON.stringify({ error: 'message too long' }));
    }
  }

  if (!OPENROUTER_API_KEY) return corsResponse(503, JSON.stringify({ error: 'AI not configured' }));

  // Forward to OpenRouter with the server-side secret
  const temperature = typeof payload.temperature === 'number' && payload.temperature >= 0 && payload.temperature <= 2
    ? payload.temperature : 0.4;
  const maxTokens = Math.min(Number(payload.max_tokens) || 900, MAX_TOKENS);
  const model = typeof payload.model === 'string' && payload.model.length <= 200 ? payload.model : DEFAULT_MODEL;

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': SUPABASE_URL, // OpenRouter attribution
        'X-Title': 'Pilates Studio App',
      },
      body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
    });

    if (!resp.ok) {
      // Forward provider status but never echo the provider body verbatim.
      return corsResponse(502, JSON.stringify({ error: `upstream ${resp.status}` }));
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') return corsResponse(502, JSON.stringify({ error: 'empty upstream response' }));

    return corsResponse(200, JSON.stringify({ content }));
  } catch {
    return corsResponse(502, JSON.stringify({ error: 'upstream unreachable' }));
  }
});
