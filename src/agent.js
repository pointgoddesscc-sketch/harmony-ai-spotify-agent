/**
 * Harmony AI – Agent Logic
 * Interprets natural language commands and maps them to Spotify actions.
 * Currently uses a lightweight rule-based + keyword approach.
 * Ready to be replaced / extended with any LLM (Grok, OpenAI, Claude, WebLLM).
 */

import * as api from './spotify-api.js';
import * as player from './player.js';

/**
 * Main entry point for the agent
 * @param {string} userMessage
 * @param {object} context - { user, devices, currentDeviceId }
 * @returns {Promise<{reply: string, actions?: any[]}>
 */
export async function processMessage(userMessage, context = {}) {
  const msg = (userMessage || '').toLowerCase().trim();
  const devices = context.devices || [];

  if (!msg) return { reply: 'Say something like “play my top tracks” or “transfer to iPhone 17 Pro”.' };

  // ── List devices ───────────────────────────────
  if (msg.includes('list devices') || msg.includes('show devices') || msg === 'devices') {
    if (devices.length === 0) return { reply: 'No devices found. Make sure Spotify is open on your phone or computer.' };
    const list = devices.map(d => `• ${d.name} (${d.type})${d.is_active ? ' ← active' : ''}`).join('\n');
    return { reply: `Available devices:\n${list}` };
  }

  // ── Transfer / Connect logic (iPhone priority) ─
  if (msg.includes('transfer') || msg.includes('connect') || msg.includes('play on') || msg.includes('switch to')) {
    return handleTransfer(msg, devices, context.currentDeviceId);
  }

  // ── Top tracks ─────────────────────────────────
  if (msg.includes('top tracks') || msg.includes('my top') || msg.includes('top songs')) {
    const data = await api.getTopTracks('medium_term', 10);
    const tracks = data.items || [];
    if (tracks.length === 0) return { reply: 'No top tracks found.' };
    const list = tracks.slice(0, 5).map((t, i) => `${i + 1}. ${t.name} – ${t.artists[0].name}`).join('\n');
    return { reply: `🔥 Your top tracks:\n${list}` };
  }

  // ── Recently played ────────────────────────────
  if (msg.includes('recent') || msg.includes('recently played')) {
    const data = await api.getRecentlyPlayed(10);
    const items = data.items || [];
    if (items.length === 0) return { reply: 'No recently played tracks.' };
    const list = items.slice(0, 5).map((item, i) => `${i + 1}. ${item.track.name} – ${item.track.artists[0].name}`).join('\n');
    return { reply: `🕒 Recently played:\n${list}` };
  }

  // ── Search & play ──────────────────────────────
  if (msg.startsWith('play ') || msg.startsWith('search ')) {
    const query = msg.replace(/^(play|search)\s+/i, '').trim();
    if (!query) return { reply: 'Tell me what to play or search for.' };
    const results = await api.search(query, ['track'], 5);
    const tracks = results.tracks?.items || [];
    if (tracks.length === 0) return { reply: `No results for “${query}”.` };
    const top = tracks[0];
    try {
      await api.startPlayback({ uris: [top.uri] });
      return { reply: `▶️ Playing “${top.name}” by ${top.artists[0].name}` };
    } catch (e) {
      return { reply: `Found “${top.name}” but playback requires Premium. (${e.message})` };
    }
  }

  // ── Help ───────────────────────────────────────
  if (msg.includes('help') || msg === '?') {
    return {
      reply: 'I can:\n• List devices\n• Transfer to iPhone 17 Pro / this agent / desktop\n• Play top tracks or recently played\n• Search & play a song\n• Create a simple playlist'
    };
  }

  return {
    reply: 'I didn’t catch that. Try “list devices”, “transfer to iPhone 17 Pro”, “play my top tracks”, or “help”.'
  };
}

/**
 * Smart device transfer with iPhone 17 Pro priority
 */
async function handleTransfer(msg, devices, currentDeviceId) {
  if (devices.length === 0) {
    return { reply: 'No devices available. Open Spotify on your phone or computer first.' };
  }

  // Priority matching for iPhone / smartphone
  let target = devices.find(d =>
    d.name.toLowerCase().includes('iphone 17 pro') ||
    d.name.toLowerCase().includes('iphone 17') ||
    (d.name.toLowerCase().includes('iphone') && msg.includes('iphone'))
  );

  if (!target && (msg.includes('phone') || msg.includes('iphone') || msg.includes('smartphone'))) {
    target = devices.find(d => d.type === 'Smartphone' || d.name.toLowerCase().includes('iphone'));
  }

  if (!target && (msg.includes('this agent') || msg.includes('this tab') || msg.includes('browser') || msg.includes('harmony'))) {
    target = devices.find(d => d.id === currentDeviceId) || devices.find(d => d.name.includes('Harmony'));
  }

  if (!target && (msg.includes('desktop') || msg.includes('computer') || msg.includes('mac') || msg.includes('pc'))) {
    target = devices.find(d => d.type === 'Computer');
  }

  // Fallback: try exact / partial name match
  if (!target) {
    target = devices.find(d => msg.includes(d.name.toLowerCase()));
  }

  if (target) {
    try {
      await api.transferPlayback(target.id, true);
      return { reply: `✅ Transferred playback to “${target.name}”.` };
    } catch (e) {
      return { reply: `Could not transfer to “${target.name}”. ${e.message}. Premium is required for transfer.` };
    }
  }

  return {
    reply: 'I can transfer to “this agent”, “iPhone 17 Pro”, “desktop”, or any device by name. Try “list devices” first.'
  };
}
