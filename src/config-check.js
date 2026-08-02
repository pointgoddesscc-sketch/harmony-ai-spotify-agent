/**
 * Harmony AI – Startup config checks
 * Shows a clear banner when required keys are missing.
 */

import { hasValidClientId, getConfigError, getRedirectUri } from './auth.js';

/**
 * Render a non-blocking warning in the dashboard if Client ID is missing
 */
export function showMissingKeyWarning() {
  if (hasValidClientId()) return;

  const err = getConfigError();
  if (!err) return;

  // Prefer existing premium-banner slot or inject a notice
  let banner = document.getElementById('config-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'config-error-banner';
    banner.className = 'premium-banner visible';
    banner.style.display = 'flex';
    banner.style.borderColor = '#7f1d1d';
    banner.style.background = 'linear-gradient(135deg, #1a0a0a 0%, #0f0f0f 100%)';

    const content = document.querySelector('#view-dashboard') || document.querySelector('.content');
    if (content) {
      content.insertBefore(banner, content.firstChild);
    }
  }

  banner.innerHTML = `
    <div class="premium-content">
      <div class="premium-icon" style="background:#ef4444;color:#fff">!</div>
      <div>
        <strong>${err.title}</strong>
        <p>${err.message}</p>
        <p class="muted" style="margin-top:6px;font-size:0.8rem">Redirect URI: <code>${getRedirectUri()}</code></p>
      </div>
    </div>
  `;

  // Also disable login button with a title hint
  const btn = document.getElementById('btn-login');
  if (btn) {
    btn.title = err.message;
  }
}

export default { showMissingKeyWarning };
