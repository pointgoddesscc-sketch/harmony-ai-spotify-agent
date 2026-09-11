/**
 * Harmony agent status + optional FastAPI proxy
 * ---------------------------------------------
 * GET  /api/harmony          → stack status (always works on Vercel)
 * GET  /api/harmony?path=x   → proxy to HARMONY_API_URL/x when configured
 * POST /api/harmony          → proxy command to HARMONY_API_URL/command
 *
 * Env (Vercel, never commit):
 *   HARMONY_API_URL — public FastAPI origin. Omit until that backend is live.
 */

function isRemoteBackend(url) {
  if (!url) return false;
  try {
    const host = new URL(url).hostname;
    return host !== 'localhost' && host !== '127.0.0.1';
  } catch {
    return false;
  }
}

function stackStatus(req) {
  const configured = process.env.HARMONY_API_URL || '';
  const backendReady = isRemoteBackend(configured);
  return {
    ok: true,
    service: 'harmony-ai-spotify-agent',
    agent: 'Harmony',
    platform: 'spotify',
    github: {
      status: 'connected',
      repo: 'pointgoddesscc-sketch/harmony-ai-spotify-agent',
    },
    vercel: {
      status: 'connected',
      project: 'harmony-ai-spotify-agent',
      host: req.headers.host || 'harmony-ai-spotify-agent.vercel.app',
    },
    backend: {
      status: backendReady ? 'configured' : 'requires_authorization',
      harmonyApiConfigured: backendReady,
      note: backendReady
        ? 'HARMONY_API_URL points at a remote backend.'
        : 'No remote FastAPI backend. Browser PKCE on this site is the live control path.',
    },
    spotifyUserSession: {
      status: 'requires_authorization',
      note: 'User must tap Connect Spotify in the browser. Grok/PIP cannot complete Spotify OAuth.',
    },
    next: [
      'Open https://harmony-ai-spotify-agent.vercel.app',
      'Tap Connect Spotify on the Premium Family account pointgoddesscc@gmail.com',
      'Confirm Redirect URI https://harmony-ai-spotify-agent.vercel.app/callback',
    ],
  };
}

export default async function handler(req, res) {
  const method = req.method;
  const configured = process.env.HARMONY_API_URL || '';
  const backendReady = isRemoteBackend(configured);

  if (method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(204).end();
  }

  if (method === 'GET' && !req.query.path) {
    return res.status(200).json(stackStatus(req));
  }

  if (!backendReady) {
    if (method === 'GET') {
      return res.status(200).json({
        ...stackStatus(req),
        requestedPath: req.query.path || 'health',
        proxied: false,
      });
    }
    if (method === 'POST') {
      return res.status(503).json({
        error: 'Harmony FastAPI backend is not deployed',
        detail: 'Set HARMONY_API_URL on Vercel to a live HTTPS origin, or use the on-page agent after Connect Spotify.',
        ...stackStatus(req),
      });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let targetUrl = configured;
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };

    if (method === 'POST') {
      targetUrl = `${configured.replace(/\/$/, '')}/command`;
      options.body = JSON.stringify(req.body || {});
    } else if (method === 'GET') {
      const path = req.query.path || 'health';
      targetUrl = `${configured.replace(/\/$/, '')}/${String(path).replace(/^\//, '')}`;
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json().catch(() => ({}));
    return res.status(response.status).json(data);
  } catch (err) {
    console.error('Harmony proxy error:', err);
    return res.status(502).json({
      error: 'Backend unavailable',
      detail: err.message,
      ...stackStatus(req),
    });
  }
}
