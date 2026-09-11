/** Public stack status for OrgSuite Harmony / Spotify agent. */

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    return res.status(204).end();
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  return res.status(200).json({
    ok: true,
    product: 'Harmony AI Spotify Agent',
    live: 'https://harmony-ai-spotify-agent.vercel.app',
    github: 'https://github.com/pointgoddesscc-sketch/harmony-ai-spotify-agent',
    vercelProject: 'harmony-ai-spotify-agent',
    chat: '/api/chat',
    harmony: '/api/harmony',
    telegramLogin: '/api/telegram-login',
    telegramBot: 'https://t.me/Orgsute_telegram_bot?start=harmony',
    telegramBotRuntime: 'https://orgsuite-telegram-bot.vercel.app',
    telegramUserMcp: 'https://pse-sent-telegram-mcp.vercel.app',
    spotifyOAuth: 'requires_authorization_in_browser',
    telegramOAuth: 'official_login_widget_or_bot_start',
  });
}
