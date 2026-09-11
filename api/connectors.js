/**
 * GET /api/connectors
 * Honest connector board for Harmony Settings.
 */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const makeConfigured = Boolean(process.env.MAKE_HARMONY_WEBHOOK_URL);

  const connectors = [
    {
      id: 'github',
      name: 'GitHub',
      icon: '💻',
      account: 'pointgoddesscc-sketch',
      status: 'connected',
      note: 'Repo + Actions tools live',
      href: 'https://github.com/pointgoddesscc-sketch/harmony-ai-spotify-agent',
    },
    {
      id: 'vercel',
      name: 'Vercel',
      icon: '▲',
      account: 'harmony-ai-spotify-agent',
      status: 'connected',
      note: 'Production READY',
      href: 'https://harmony-ai-spotify-agent.vercel.app',
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '✉️',
      account: 'pointgoddesscc@gmail.com',
      status: 'connected',
      note: 'Live via Grok/PIP session',
    },
    {
      id: 'calendar',
      name: 'Google Calendar',
      icon: '📅',
      account: 'pointgoddesscc@gmail.com',
      status: 'connected',
      note: 'Live via Grok/PIP session',
    },
    {
      id: 'drive',
      name: 'Google Drive',
      icon: '📁',
      account: 'pointgoddesscc@gmail.com',
      status: 'connected',
      note: 'Live via PIP Drive search',
    },
    {
      id: 'linear',
      name: 'Linear',
      icon: '◆',
      account: 'PSE Management',
      status: 'connected',
      note: 'Workplace team live',
      href: 'https://linear.app/pse-management',
    },
    {
      id: 'make',
      name: 'Make.com',
      icon: '⚙️',
      account: 'OrgSuite-Grok-In',
      status: makeConfigured ? 'connected' : 'requires_authorization',
      note: makeConfigured
        ? 'Webhook env set on Vercel'
        : 'Grok Make tile + MAKE_HARMONY_WEBHOOK_URL still required',
      href: '/api/make-event',
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: '✈️',
      account: '@Orgsute_telegram_bot',
      status: 'requires_authorization',
      note: 'Login card live. Bot token + BotFather domain still needed.',
      href: 'https://t.me/Orgsute_telegram_bot?start=harmony',
    },
    {
      id: 'spotify',
      name: 'Spotify',
      icon: '🎵',
      account: 'pointgoddesscc@gmail.com',
      status: 'requires_authorization',
      note: 'Premium Family on the phone. Harmony still needs Connect Spotify.',
      href: 'https://harmony-ai-spotify-agent.vercel.app',
    },
    {
      id: 'godaddy',
      name: 'GoDaddy',
      icon: '🌐',
      account: 'psemanagement.services',
      status: 'requires_authorization',
      note: 'MCP keys missing on Vercel',
    },
  ];

  return res.status(200).json({
    ok: true,
    updated: new Date().toISOString(),
    source: 'harmony-ai-spotify-agent',
    connectors,
  });
}
