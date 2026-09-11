/**
 * Official Telegram connect for Harmony.
 * Uses the Telegram Login Widget + t.me bot deep link.
 * Never collects a Telegram password on this site.
 */

const STORAGE_KEY = 'harmony_telegram_user';
const BOT_USERNAME =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_BOT_USERNAME) ||
  'Orgsute_telegram_bot';

const BOT_START = `https://t.me/${BOT_USERNAME}?start=harmony`;
const BOT_PAGE = `https://t.me/${BOT_USERNAME}`;
const MCP_AUTHORIZE = 'https://pse-sent-telegram-mcp.vercel.app/telegram/oauth/authorize';

export function getTelegramSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearTelegramSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function botStartUrl() {
  return BOT_START;
}

export function initTelegram({ onLinked } = {}) {
  const session = getTelegramSession();
  renderTelegramCard(session);
  mountWidget(onLinked);
  wireButtons(onLinked);
  return session;
}

function wireButtons(onLinked) {
  document.getElementById('btn-telegram-open')?.addEventListener('click', () => {
    window.open(BOT_START, '_blank', 'noopener');
  });
  document.getElementById('btn-telegram-disconnect')?.addEventListener('click', () => {
    clearTelegramSession();
    renderTelegramCard(null);
    mountWidget(onLinked);
    onLinked?.(null);
  });
  document.getElementById('btn-telegram-mcp')?.addEventListener('click', () => {
    window.open(MCP_AUTHORIZE, '_blank', 'noopener');
  });
}

function renderTelegramCard(session) {
  const nameEl = document.getElementById('telegram-account-name');
  const statusEl = document.getElementById('telegram-account-status');
  const nextEl = document.getElementById('telegram-next-step');
  const openBtn = document.getElementById('btn-telegram-open');
  const discBtn = document.getElementById('btn-telegram-disconnect');

  if (session?.id) {
    const label = session.username ? `@${session.username}` : session.first_name || `id ${session.id}`;
    if (nameEl) nameEl.textContent = label;
    if (statusEl) {
      statusEl.textContent = 'Linked';
      statusEl.className = 'plan-badge premium';
    }
    if (nextEl) {
      nextEl.textContent =
        'Telegram is linked in this browser. Open the bot so OrgSuite can continue, then Connect Spotify if you have not already.';
    }
    if (openBtn) openBtn.textContent = 'Continue in Telegram';
    discBtn?.classList.remove('hidden');
  } else {
    if (nameEl) nameEl.textContent = 'Not connected';
    if (statusEl) {
      statusEl.textContent = 'Login required';
      statusEl.className = 'plan-badge free';
    }
    if (nextEl) {
      nextEl.textContent =
        'Use Log in with Telegram below, or open the official bot. After you approve, Harmony continues with Spotify.';
    }
    if (openBtn) openBtn.textContent = 'Open Telegram bot';
    discBtn?.classList.add('hidden');
  }
}

function mountWidget(onLinked) {
  const host = document.getElementById('telegram-login-widget');
  if (!host) return;
  host.innerHTML = '';

  if (getTelegramSession()?.id) return;

  window.onHarmonyTelegramAuth = async (user) => {
    const stored = {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name || '',
      username: user.username || '',
      photo_url: user.photo_url || '',
      auth_date: user.auth_date,
      linkedAt: new Date().toISOString(),
    };
    try {
      await fetch('/api/telegram-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
    } catch {
      // Browser link still works if verify endpoint is cold.
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    renderTelegramCard(stored);
    onLinked?.(stored);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://telegram.org/js/telegram-widget.js?22';
  script.setAttribute('data-telegram-login', BOT_USERNAME);
  script.setAttribute('data-size', 'large');
  script.setAttribute('data-radius', '8');
  script.setAttribute('data-request-access', 'write');
  script.setAttribute('data-userpic', 'false');
  script.setAttribute('data-onauth', 'onHarmonyTelegramAuth(user)');
  host.appendChild(script);
}

export default {
  initTelegram,
  getTelegramSession,
  clearTelegramSession,
  botStartUrl,
  BOT_PAGE,
};
