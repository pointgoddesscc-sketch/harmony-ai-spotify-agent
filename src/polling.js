/**
 * Harmony AI – Real-time Polling
 * Keeps Now Playing + Devices in sync.
 * OrgSuite Edition
 */

const POLL_INTERVAL_MS = 4000;       // 4 seconds
const DEVICE_POLL_EVERY = 3;         // every 3rd tick (~12s)

let pollTimer = null;
let tickCount = 0;
let isPolling = false;

/**
 * Start real-time polling
 * @param {object} handlers
 * @param {Function} handlers.onPlayback - (state) => void
 * @param {Function} handlers.onDevices  - () => void  (refresh devices)
 * @param {Function} handlers.fetchPlayback - async () => state | null
 */
export function startPolling({ onPlayback, onDevices, fetchPlayback }) {
  stopPolling();
  isPolling = true;
  tickCount = 0;

  const tick = async () => {
    if (!isPolling) return;

    // Skip if tab is hidden to save resources
    if (document.hidden) {
      pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
      return;
    }

    try {
      const state = await fetchPlayback();
      if (state && onPlayback) onPlayback(state);
    } catch (err) {
      // Silent – common when nothing is playing or Free plan limits
      console.debug('[Harmony Poll] playback:', err.message);
    }

    tickCount += 1;
    if (tickCount % DEVICE_POLL_EVERY === 0 && onDevices) {
      try {
        await onDevices();
      } catch (err) {
        console.debug('[Harmony Poll] devices:', err.message);
      }
    }

    pollTimer = setTimeout(tick, POLL_INTERVAL_MS);
  };

  // First tick after a short delay
  pollTimer = setTimeout(tick, 1200);
}

/**
 * Stop polling (call on logout)
 */
export function stopPolling() {
  isPolling = false;
  if (pollTimer) {
    clearTimeout(pollTimer);
    pollTimer = null;
  }
  tickCount = 0;
}

/**
 * Whether polling is currently active
 */
export function isPollingActive() {
  return isPolling;
}

export default { startPolling, stopPolling, isPollingActive };
