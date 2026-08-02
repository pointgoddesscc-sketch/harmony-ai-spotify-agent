/**
 * Harmony AI – Real-time Chat Edge Function (Cache Optimized)
 * ------------------------------------------------------------
 * Vercel Edge Runtime with smart caching:
 * - Generic replies (help, greetings) → short CDN/edge cache
 * - Personalized / Grok replies → no-store
 *
 * Path: /api/chat
 *
 * Env:
 *   XAI_API_KEY           – enables Grok
 *   HARMONY_SYSTEM_PROMPT – optional personality override
 *   CHAT_CACHE_TTL        – seconds for generic cache (default 60)
 */

export const config = {
  runtime: 'edge',
};

const DEFAULT_SYSTEM = `You are Harmony, a friendly and professional Spotify AI music agent from OrgSuite.
You help users control music, transfer playback between devices, and answer questions about their listening.
Keep replies short, natural, and helpful. Never invent track data you do not have.
If the user asks about Premium features and they are Free, gently remind them.`;

// In-memory edge cache for generic replies (survives warm isolates briefly)
const memoryCache = new Map();
const DEFAULT_TTL_MS = 60_000; // 60 seconds

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405, 'no-store');
  }

  try {
    const body = await req.json();
    const message = (body.message || body.command || '').trim();
    const context = body.context || {};

    if (!message) {
      return json(
        { reply: 'Say something like “what’s playing” or “play some lo-fi”.', source: 'edge' },
        200,
        'public, max-age=30, s-maxage=60'
      );
    }

    const isPersonalized = !!(context.user || context.devices?.length || context.isPremium != null);
    const cacheKey = !isPersonalized ? normalizeKey(message) : null;

    // 1) Memory cache hit (generic only)
    if (cacheKey) {
      const hit = memoryCache.get(cacheKey);
      if (hit && Date.now() < hit.expires) {
        return json(
          { reply: hit.reply, source: hit.source, cached: true },
          200,
          cacheControlHeader(true)
        );
      }
    }

    // 2) Prefer Grok when key is present (never cache Grok output)
    const xaiKey = process.env.XAI_API_KEY;
    if (xaiKey) {
      const grokReply = await callGrok(xaiKey, message, context);
      if (grokReply) {
        return json({ reply: grokReply, source: 'grok', cached: false }, 200, 'no-store');
      }
    }

    // 3) Local edge reply
    const reply = localEdgeReply(message, context);
    const source = 'edge';

    // Store generic replies in memory cache
    if (cacheKey) {
      const ttl = Number(process.env.CHAT_CACHE_TTL || 60) * 1000;
      memoryCache.set(cacheKey, {
        reply,
        source,
        expires: Date.now() + (ttl || DEFAULT_TTL_MS),
      });
      // Prevent unbounded growth
      if (memoryCache.size > 200) {
        const firstKey = memoryCache.keys().next().value;
        memoryCache.delete(firstKey);
      }
    }

    return json(
      { reply, source, cached: false },
      200,
      isPersonalized ? 'no-store' : cacheControlHeader(false)
    );
  } catch (err) {
    console.error('[Harmony Chat Edge]', err);
    return json({ error: 'Chat failed', detail: err.message }, 500, 'no-store');
  }
}

function normalizeKey(msg) {
  return msg.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 120);
}

function cacheControlHeader(fromCache) {
  // Short CDN cache for generic replies; allow stale-while-revalidate
  const ttl = Number(process.env.CHAT_CACHE_TTL || 60);
  return `public, max-age=${Math.min(ttl, 30)}, s-maxage=${ttl}, stale-while-revalidate=120`;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function json(data, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': cacheControl.startsWith('public') ? cacheControl : 'no-store',
      'Vercel-CDN-Cache-Control': cacheControl.startsWith('public') ? cacheControl : 'no-store',
      ...corsHeaders(),
    },
  });
}

function localEdgeReply(msg, context) {
  const m = msg.toLowerCase();
  const name = context.user?.display_name?.split(' ')[0] || 'friend';

  if (/^(hi|hello|hey|yo|sup)/.test(m)) {
    return `Hey ${name}! Ready when you are. What should we play or transfer?`;
  }
  if (m.includes('thank')) return `Anytime! Just say the word.`;
  if (m.includes('help') || m === '?') {
    return `I can help with:\n• What’s playing\n• List / transfer devices\n• Top tracks & recent plays\n• Search & play songs\n\nJust talk normally.`;
  }
  if (m.includes('what’s playing') || m.includes('whats playing') || m.includes('now playing')) {
    return `I need a live Spotify session for that. Open the dashboard and connect Spotify, then ask me again.`;
  }
  if (m.includes('device') || m.includes('transfer') || m.includes('iphone')) {
    return `Open the Devices tab or say “list devices”. I can move playback once Spotify is connected.`;
  }
  if (m.includes('premium')) {
    return `Full Web Playback and device transfer need Spotify Premium. You can still search and view your library on Free.`;
  }

  return `Got it, ${name}. Try “list devices”, “my top tracks”, or “play some chill lo-fi” once Spotify is connected.`;
}

async function callGrok(apiKey, message, context) {
  try {
    const system = process.env.HARMONY_SYSTEM_PROMPT || DEFAULT_SYSTEM;
    const userContext = context.user
      ? `User: ${context.user.display_name || 'Unknown'}. Plan: ${context.isPremium ? 'Premium' : 'Free'}.`
      : '';

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages: [
          { role: 'system', content: system + (userContext ? `\n${userContext}` : '') },
          { role: 'user', content: message },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!res.ok) {
      console.error('Grok error', await res.text());
      return null;
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    console.error('Grok call failed', e);
    return null;
  }
}
