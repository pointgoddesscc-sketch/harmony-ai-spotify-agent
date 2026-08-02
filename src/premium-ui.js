/**
 * Harmony AI – Premium UI + Developer Mode helpers
 * ------------------------------------------------
 * Import in main.js and call after authentication.
 *
 * Usage:
 *   import { updateDevModeBadge, handlePremiumBanner } from './premium-ui.js';
 *
 *   // inside onAuthenticated() after isPremium is known:
 *   updateDevModeBadge(isPremium);
 *   handlePremiumBanner(isPremium);
 */

const STORAGE_KEY = 'harmony_premium_dismissed';

/**
 * Update the Developer Mode badge in the sidebar
 * @param {boolean} isPremium
 */
export function updateDevModeBadge(isPremium) {
  const badge = document.getElementById('dev-mode-badge');
  const text = document.getElementById('dev-mode-text');
  if (!badge || !text) return;

  if (isPremium) {
    badge.classList.add('premium');
    text.textContent = 'Developer Mode • Premium';
  } else {
    badge.classList.remove('premium');
    text.textContent = 'Developer Mode • Free';
  }
}

/**
 * Show / hide the high-end Free → Premium banner
 * @param {boolean} isPremium
 */
export function handlePremiumBanner(isPremium) {
  const banner = document.getElementById('premium-banner');
  if (!banner) return;

  if (isPremium) {
    banner.classList.remove('visible');
    banner.style.display = 'none';
    return;
  }

  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed === 'true') {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'flex';
  banner.classList.add('visible');

  // Wire Upgrade tracking once
  const upgradeBtn = document.getElementById('btn-upgrade-premium');
  if (upgradeBtn && !upgradeBtn.dataset.wired) {
    upgradeBtn.dataset.wired = '1';
    upgradeBtn.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'spotify_premium_upgrade_click', {
          event_category: 'conversion',
          event_label: 'harmony_agent_banner'
        });
      }
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'spotify_premium_upgrade_click',
        component: 'harmony_agent'
      });
    });
  }

  // Soft dismiss
  const laterBtn = document.getElementById('btn-premium-later');
  if (laterBtn && !laterBtn.dataset.wired) {
    laterBtn.dataset.wired = '1';
    laterBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      banner.style.display = 'none';
      banner.classList.remove('visible');
    });
  }
}

export default {
  updateDevModeBadge,
  handlePremiumBanner
};
