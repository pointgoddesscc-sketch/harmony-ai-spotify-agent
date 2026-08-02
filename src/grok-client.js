/**
 * Harmony AI – Grok Backend Client
 * --------------------------------
 * Lightweight JavaScript module for calling the FastAPI Grok agent
 * from any marketing website, dashboard, or OrgSuite interface.
 *
 * Usage (ES module):
 *   import { sendCommand, getDevices, getProfile, checkHealth } from './grok-client.js';
 *
 *   const reply = await sendCommand('transfer to iPhone');
 *   console.log(reply);
 *
 * Documentation style: production-ready for modern website development.
 */

const DEFAULT_BASE_URL = import.meta.env.VITE_HARMONY_API_URL || 'http://localhost:8080';

/**
 * Send a natural language command to the Grok agent.
 * @param {string} command - e.g. "list devices", "play my top tracks", "transfer to iPhone"
 * @param {string} [baseUrl] - Optional override for the API base URL
 * @returns {Promise<string>} The agent's text reply
 */
export async function sendCommand(command, baseUrl = DEFAULT_BASE_URL) {
  if (!command || typeof command !== 'string') {
    throw new Error('Command must be a non-empty string');
  }

  const response = await fetch(`${baseUrl}/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ command: command.trim() }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Agent error ${response.status}`);
  }

  const data = await response.json();
  return data.reply;
}

/**
 * Get current Spotify Connect devices via the agent.
 * @param {string} [baseUrl]
 * @returns {Promise<string>}
 */
export async function getDevices(baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/devices`);
  if (!response.ok) throw new Error(`Devices error ${response.status}`);
  const data = await response.json();
  return data.reply;
}

/**
 * Get current user profile + plan (Free / Premium).
 * @param {string} [baseUrl]
 * @returns {Promise<string>}
 */
export async function getProfile(baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/profile`);
  if (!response.ok) throw new Error(`Profile error ${response.status}`);
  const data = await response.json();
  return data.reply;
}

/**
 * Health check – returns premium status and connected user.
 * @param {string} [baseUrl]
 * @returns {Promise<{status: string, premium: boolean, user: string}>}
 */
export async function checkHealth(baseUrl = DEFAULT_BASE_URL) {
  const response = await fetch(`${baseUrl}/health`);
  if (!response.ok) throw new Error(`Health check failed ${response.status}`);
  return response.json();
}

/**
 * Example integration for a marketing landing page button
 * ------------------------------------------------------
 * Add this to any page that has a "Talk to Harmony" or
 * "Connect & Control" CTA.
 *
 * HTML:
 *   <button id="harmony-cmd-btn">Ask Harmony</button>
 *   <pre id="harmony-reply"></pre>
 *
 * Then call setupHarmonyButton() after DOM load.
 */
export function setupHarmonyButton(buttonId = 'harmony-cmd-btn', replyId = 'harmony-reply') {
  const btn = document.getElementById(buttonId);
  const replyEl = document.getElementById(replyId);
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const command = prompt('What should Harmony do?', 'list devices');
    if (!command) return;

    btn.disabled = true;
    btn.textContent = 'Thinking…';
    try {
      const reply = await sendCommand(command);
      if (replyEl) {
        replyEl.textContent = reply;
        replyEl.style.display = 'block';
      } else {
        alert(reply);
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Ask Harmony';
    }
  });
}

// Default export for convenience
export default {
  sendCommand,
  getDevices,
  getProfile,
  checkHealth,
  setupHarmonyButton,
};
