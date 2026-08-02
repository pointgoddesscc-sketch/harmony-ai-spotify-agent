/**
 * Vercel Serverless Proxy for Harmony Grok Agent
 * ----------------------------------------------
 * Place this file at /api/harmony.js in a Vercel project
 * (or use as reference for your own backend domain).
 *
 * This proxy allows the front-end (same origin) to call the
 * remote FastAPI Grok agent without CORS issues and keeps
 * the real backend URL private if desired.
 *
 * Environment variables required in Vercel:
 *   HARMONY_API_URL = https://your-python-backend.example.com
 *
 * Usage from front-end:
 *   fetch('/api/harmony', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({ command: 'list devices' })
 *   })
 */

export default async function handler(req, res) {
  // Only allow POST for commands, GET for health/devices/profile
  const method = req.method;
  const base = process.env.HARMONY_API_URL || 'http://localhost:8080';

  if (!base) {
    return res.status(500).json({ error: 'HARMONY_API_URL not configured' });
  }

  try {
    let targetUrl = base;
    let options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (method === 'POST') {
      targetUrl = `${base}/command`;
      options.body = JSON.stringify(req.body || {});
    } else if (method === 'GET') {
      // Map query path if needed, default to health
      const path = req.query.path || 'health';
      targetUrl = `${base}/${path}`;
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const response = await fetch(targetUrl, options);
    const data = await response.json().catch(() => ({}));

    // Forward status and body
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Harmony proxy error:', err);
    res.status(502).json({ error: 'Backend unavailable', detail: err.message });
  }
}
