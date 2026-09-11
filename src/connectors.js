/**
 * Harmony AI – Connector Status Monitoring
 * Loads workplace status from /api/connectors, then overlays browser sessions.
 */

const FALLBACK = [
  { id: 'github', name: 'GitHub', account: 'pointgoddesscc-sketch', icon: '💻', status: 'connected' },
  { id: 'vercel', name: 'Vercel', account: 'harmony-ai-spotify-agent', icon: '▲', status: 'connected' },
  { id: 'gmail', name: 'Gmail', account: 'pointgoddesscc@gmail.com', icon: '✉️', status: 'connected' },
  { id: 'calendar', name: 'Google Calendar', account: 'pointgoddesscc@gmail.com', icon: '📅', status: 'connected' },
  { id: 'drive', name: 'Google Drive', account: 'pointgoddesscc@gmail.com', icon: '📁', status: 'connected' },
  { id: 'linear', name: 'Linear', account: 'PSE Management', icon: '◆', status: 'connected' },
  { id: 'telegram', name: 'Telegram', account: '@Orgsute_telegram_bot', icon: '✈️', status: 'requires_authorization' },
  { id: 'spotify', name: 'Spotify', account: 'Music agent', icon: '🎵', status: 'requires_authorization' },
];

function statusLabel(status) {
  if (status === 'connected' || status === 'premium') return status === 'premium' ? 'Premium' : 'Connected';
  if (status === 'requires_authorization') return 'Needs login';
  return 'Not connected';
}

function paintRow(c) {
  const tone =
    c.status === 'connected' || c.status === 'premium'
      ? 'background:var(--primary-soft);color:var(--primary)'
      : c.status === 'requires_authorization'
        ? 'background:var(--warning-soft);color:var(--warning)'
        : 'background:var(--surface-2);color:var(--muted)';
  const account = c.note ? `${c.account} — ${c.note}` : c.account;
  return `
    <div class="connector-row" data-id="${c.id}">
      <div class="connector-info">
        <div class="connector-icon">${c.icon}</div>
        <div>
          <strong style="font-size:0.9rem">${c.name}</strong>
          <p class="muted" style="margin:0;font-size:0.78rem">${account}</p>
        </div>
      </div>
      <span class="connector-status" style="${tone}">${statusLabel(c.status)}</span>
    </div>`;
}

export async function renderConnectors() {
  const container = document.getElementById('connectors-list');
  if (!container) return;
  let list = FALLBACK;
  try {
    const res = await fetch('/api/connectors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.connectors) && data.connectors.length) list = data.connectors;
    }
  } catch {
    /* keep fallback */
  }
  container.innerHTML = list.map(paintRow).join('');
}

export function updateSpotifyConnectorStatus(isLoggedIn, isPremium) {
  const row = document.querySelector('[data-id="spotify"]');
  if (!row) return;
  const statusEl = row.querySelector('.connector-status');
  const accountEl = row.querySelector('.muted');
  if (isLoggedIn) {
    statusEl.textContent = isPremium ? 'Premium' : 'Connected (Free)';
    statusEl.style.background = isPremium ? 'var(--primary-soft)' : 'var(--warning-soft)';
    statusEl.style.color = isPremium ? 'var(--primary)' : 'var(--warning)';
    if (accountEl) accountEl.textContent = isPremium ? 'Premium active' : 'Free plan';
  } else {
    statusEl.textContent = 'Needs login';
    statusEl.style.background = 'var(--warning-soft)';
    statusEl.style.color = 'var(--warning)';
    if (accountEl) accountEl.textContent = 'Connect Spotify to activate';
  }
}

export function updateTelegramConnectorStatus(session) {
  const row = document.querySelector('[data-id="telegram"]');
  if (!row) return;
  const statusEl = row.querySelector('.connector-status');
  const accountEl = row.querySelector('.muted');
  const settingsName = document.getElementById('settings-telegram');
  const settingsPlan = document.getElementById('settings-telegram-plan');

  if (session?.id) {
    const label = session.username ? `@${session.username}` : session.first_name || `id ${session.id}`;
    statusEl.textContent = 'Linked';
    statusEl.style.background = 'var(--primary-soft)';
    statusEl.style.color = 'var(--primary)';
    if (accountEl) accountEl.textContent = label;
    if (settingsName) settingsName.textContent = label;
    if (settingsPlan) {
      settingsPlan.textContent = 'Linked';
      settingsPlan.className = 'plan-badge premium';
    }
  } else {
    statusEl.textContent = 'Needs login';
    statusEl.style.background = 'var(--warning-soft)';
    statusEl.style.color = 'var(--warning)';
    if (accountEl) accountEl.textContent = '@Orgsute_telegram_bot';
    if (settingsName) settingsName.textContent = 'Not connected — use official Login Widget or @Orgsute_telegram_bot';
    if (settingsPlan) {
      settingsPlan.textContent = 'Off';
      settingsPlan.className = 'plan-badge free';
    }
  }
}

export default { renderConnectors, updateSpotifyConnectorStatus, updateTelegramConnectorStatus };
