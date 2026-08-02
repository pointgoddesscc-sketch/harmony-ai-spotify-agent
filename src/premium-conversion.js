/**
 * Harmony AI – Premium Conversion Module
 * --------------------------------------
 * Handles the Free → Premium upgrade experience.
 * Import this in main.js or any marketing page.
 *
 * Features:
 * - Stronger benefit-driven messaging
 * - Conversion event tracking (gtag ready)
 * - Soft “Maybe later” dismissal (localStorage)
 * - Clean show / hide of the premium banner
 */

const STORAGE_KEY = 'harmony_premium_dismissed';

/**
 * Show the premium banner if the user is on Free and has not dismissed it.
 * @param {boolean} isPremium
 */
export function handlePremiumStatus(isPremium) {
  const banner = document.getElementById('premium-banner');
  if (!banner) return;

  if (isPremium) {
    banner.style.display = 'none';
    banner.classList.remove('visible');
    return;
  }

  // Check if user previously clicked “Maybe later”
  const dismissed = localStorage.getItem(STORAGE_KEY);
  if (dismissed === 'true') {
    banner.style.display = 'none';
    return;
  }

  banner.style.display = 'flex';
  banner.classList.add('visible');

  // Wire the Upgrade button tracking
  const upgradeBtn = document.getElementById('btn-upgrade-premium');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', () => {
      if (typeof gtag === 'function') {
        gtag('event', 'spotify_premium_upgrade_click', {
          event_category: 'conversion',
          event_label: 'harmony_agent_banner',
          value: 1
        });
      }
      // Optional: also push to dataLayer for GTM
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'spotify_premium_upgrade_click',
        component: 'harmony_agent'
      });
    });
  }

  // Soft dismiss
  const laterBtn = document.getElementById('btn-premium-later');
  if (laterBtn) {
    laterBtn.addEventListener('click', () => {
      localStorage.setItem(STORAGE_KEY, 'true');
      banner.style.display = 'none';
      banner.classList.remove('visible');
    });
  }
}

/**
 * Force show the banner again (e.g. from settings or after a failed play attempt)
 */
export function forceShowPremiumBanner() {
  localStorage.removeItem(STORAGE_KEY);
  const banner = document.getElementById('premium-banner');
  if (banner) {
    banner.style.display = 'flex';
    banner.classList.add('visible');
  }
}

export default {
  handlePremiumStatus,
  forceShowPremiumBanner
};
