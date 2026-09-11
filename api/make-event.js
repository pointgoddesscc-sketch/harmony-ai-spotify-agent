/**
 * POST /api/make-event
 * Forwards an OrgSuite event to MAKE_HARMONY_WEBHOOK_URL when that env is set.
 * Never logs the webhook URL.
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
      ok: true,
      service: 'harmony-make-event',
      configured,
      note: configured
        ? 'Webhook env is set. POST an event to forward it.'
        : 'Set MAKE_HARMONY_WEBHOOK_URL on Vercel to forward events. Do not commit the URL.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!configured) {
    return res.status(200).json({
      ok: true,
      forwarded: false,
      reason: 'MAKE_HARMONY_WEBHOOK_URL not set',
    });
  }

  const hook = process.env.MAKE_HARMONY_WEBHOOK_URL;
  const key = process.env.MAKE_WEBHOOK_KEY || '';
  const body = {
    source: 'harmony',
    email: 'pointgoddesscc@gmail.com',
    event: req.body?.event || 'harmony_event',
    at: new Date().toISOString(),
    payload: req.body?.payload || req.body || {},
  };

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers['x-make-apikey'] = key;
    const upstream = await fetch(hook, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    return res.status(200).json({
      ok: upstream.ok,
      forwarded: true,
      status: upstream.status,
    });
  } catch {
    return res.status(502).json({ ok: false, forwarded: false, error: 'Make webhook request failed' });
  }
}
