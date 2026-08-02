/**
 * Harmony AI – Connector Status Monitoring
 * Displays connected services status in Settings.
 * OrgSuite Edition
 */

const CONNECTORS = [
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
    status: 'connected'
  }
];

/**
 * Render connector status list into the container
 */
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
      <span class="connector-status">${c.status === 'connected' ? 'Connected' : 'Disconnected'}</span>
    </div>
  `).join('');
}

/**
 * Update Spotify connector status based on login state
 */
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

export default { renderConnectors, updateSpotifyConnectorStatus };
