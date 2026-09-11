/**
 * POST /api/telegram-login
 * Verifies official Telegram Login Widget data when TELEGRAM_BOT_TOKEN is set.
 * Never stores the token in GitHub. Never accepts a password.
 */

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const id = Number(body.id);
  if (!id) {
    return res.status(400).json({ error: 'Missing Telegram user id from Login Widget' });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || '';
  let verified = false;
  if (token && body.hash) {
    verified = verifyTelegramLogin(body, token);
    if (!verified) {
      return res.status(401).json({ error: 'Telegram login hash did not verify' });
    }
  }

  return res.status(200).json({
    ok: true,
    verified,
    user: {
      id,
      username: body.username || null,
      first_name: body.first_name || null,
    },
    next: [
      'Open https://t.me/Orgsute_telegram_bot?start=harmony',
      'Connect Spotify on this same Harmony page',
    ],
    note: verified
      ? 'Widget signature verified. Bot and Harmony can continue from this user id.'
      : 'Linked in browser. Set TELEGRAM_BOT_TOKEN on Vercel to verify widget signatures server-side.',
  });
}

function verifyTelegramLogin(data, botToken) {
  const { hash, ...fields } = data;
  if (!hash || typeof hash !== 'string') return false;
  const check = Object.keys(fields)
    .filter((k) => fields[k] !== undefined && fields[k] !== null && fields[k] !== '')
    .sort()
    .map((k) => `${k}=${fields[k]}`)
    .join('\n');
  const secret = createHash('sha256').update(botToken).digest();
  const hmac = createHmac('sha256', secret).update(check).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}
