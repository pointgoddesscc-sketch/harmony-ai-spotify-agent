/**
 * Harmony AI – Connector Status Monitoring
 * Displays connected services status in Settings.
 * OrgSuite Edition
 */

const CONNECTORS = [
  {
    id: 'telegram',
    name: 'Telegram',
    account: '@Orgsute_telegram_bot',
    icon: '✈️',
    status: 'disconnected'
  },
  {
    id: 'gmail',
    name: 'Gmail',
    account: 'pointgoddesscc@gmail.com',
    icon: '✉️',
    status: 'connected'
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    account: 'pointgoddesscc@gmail.com',
    icon: '📅',
    status: 'connected'
  },
  {
    id: 'drive',
    name: 'Google Drive',
    account: 'pointgoddesscc@gmail.com',
    icon: '📁',
    status: 'connected'
  },
  {
    id: 'maps',
    name: 'Google Maps',
    account: 'Connected for location tasks',
    icon: '📍',
    status: 'connected'
  },
  {
    id: 'spotify',
    name: 'Spotify',
    account: 'Music agent',
    icon: '🎵',
    status: 'disconnected'
  }
];

export function renderConnectors() {
  const container = document.getElementById('connectors-list');
  if (!container) return;

  container.innerHTML = CONNECTORS.map(c => `
    <div class="connector-row" data-id="${c.id}">
      <div class="connector-info">
        <div class="connector-icon">${c.icon}</div>
        <div>
          <strong style="font-size:0.9rem">${c.name}</strong>
          <p class="muted" style="margin:0;font-size:0.78rem">${c.account}</p>
        </div>
      </div>
      <span class="connector-status">${c.status === 'connected' ? 'Connected' : 'Not connected'}</span>
    </div>
  `).join('');
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
    statusEl.textContent = 'Not connected';
    statusEl.style.background = 'var(--surface-2)';
    statusEl.style.color = 'var(--muted)';
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
    statusEl.textContent = 'Not connected';
    statusEl.style.background = 'var(--surface-2)';
    statusEl.style.color = 'var(--muted)';
    if (accountEl) accountEl.textContent = '@Orgsute_telegram_bot';
    if (settingsName) settingsName.textContent = 'Not connected — use official Login Widget or @Orgsute_telegram_bot';
    if (settingsPlan) {
      settingsPlan.textContent = 'Off';
      settingsPlan.className = 'plan-badge free';
    }
  }
}

export default { renderConnectors, updateSpotifyConnectorStatus, updateTelegramConnectorStatus };
