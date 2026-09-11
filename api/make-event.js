/**
 * GET/POST /api/make-event
 * Harmony → Make.com bridge. Webhook URL only from env. Never returned.
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-make-apikey');
    return res.status(204).end();
  }

  const configured = Boolean(process.env.MAKE_HARMONY_WEBHOOK_URL);

  if (req.method === 'GET') {
    return res.status(200).json({
      service: 'make',
      configured,
      status: configured ? 'ready' : 'missing_webhook',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!configured) {
    return res.status(200).json({
      ok: true,
      forwarded: false,
      status: 'missing_webhook',
    });
  }

  const incoming = req.body || {};
  const body = {
    source: incoming.source || 'OrgSuite',
    event: incoming.event || 'harmony.event',
    payload: incoming.payload || incoming,
    at: new Date().toISOString(),
  };

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.MAKE_WEBHOOK_KEY) {
    headers['x-make-apikey'] = process.env.MAKE_WEBHOOK_KEY;
  }

  try {
    const upstream = await fetch(process.env.MAKE_HARMONY_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res.status(200).json({
      ok: upstream.ok,
      forwarded: true,
      status: upstream.ok ? 'ready' : 'upstream_error',
    });
  } catch {
    return res.status(502).json({
      ok: false,
      forwarded: false,
      status: 'upstream_error',
    });
  }
}
