/**
 * Harmony AI – Main Application Entry (Production Ready)
 * Orchestrates Auth, Web Playback SDK, Device Management, Chat UI & Agent.
 * Fully synced with the current dashboard index.html
 * OrgSuite Edition – Premium UI + Connector Status Monitoring
 */

import { login, logout, isLoggedIn, exchangeCodeForToken } from './auth.js';
import * as api from './spotify-api.js';
import * as player from './player.js';
import { processMessage } from './agent.js';
import { updateDevModeBadge, handlePremiumBanner } from './premium-ui.js';
import { renderConnectors, updateSpotifyConnectorStatus } from './connectors.js';

// ── DOM references (matched to current index.html) ──────────────────
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userChip = document.getElementById('user-chip');
const userName = document.getElementById('user-name');
const userPlan = document.getElementById('user-plan');
const agentStatus = document.getElementById('agent-status');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const deviceList = document.getElementById('device-list');
const btnRefreshDevices = document.getElementById('btn-refresh-devices');
const btnRefreshDevices2 = document.getElementById('btn-refresh-devices-2');
const trackName = document.getElementById('track-name');
const trackArtist = document.getElementById('track-artist');
const trackArt = document.getElementById('track-art');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const volumeSlider = document.getElementById('volume');
const settingsAccount = document.getElementById('settings-account');
const settingsPlan = document.getElementById('settings-plan');
const settingsSdk = document.getElementById('settings-sdk');
const settingsRedirect = document.getElementById('settings-redirect');
const activeDeviceName = document.getElementById('active-device-name');
const activeDeviceType = document.getElementById('active-device-type');
const viewTitle = document.getElementById('view-title');

let currentUser = null;
let currentDeviceId = null;
let devices = [];
let isPremium = false;

// ── Bootstrap ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  // Render connector status immediately
  renderConnectors();

  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  btnLogin?.addEventListener('click', () => login());
  btnLogout?.addEventListener('click', () => {
    logout();
    player.disconnect();
    setLoggedOutUI();
    addMessage('agent', 'Disconnected. Click Connect Spotify to start again.');
  });

  chatForm?.addEventListener('submit', handleChatSubmit);
  btnRefreshDevices?.addEventListener('click', refreshDevices);
  btnRefreshDevices2?.addEventListener('click', refreshDevices);
  btnPlay?.addEventListener('click', () => player.togglePlay());
  btnPrev?.addEventListener('click', () => player.previousTrack());
  btnNext?.addEventListener('click', () => player.nextTrack());
  volumeSlider?.addEventListener('input', (e) => player.setVolume(parseFloat(e.target.value)));

  // Quick actions
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleQuickAction(btn.dataset.action));
  });

  // Show current redirect URI in settings
  if (settingsRedirect) {
    settingsRedirect.textContent = window.location.origin + '/callback';
  }

  // Handle OAuth callback
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    try {
      if (agentStatus) agentStatus.textContent = 'Authenticating...';
      await exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, '/');
      await onAuthenticated();
    } catch (err) {
      addMessage('agent', `Login error: ${err.message}`);
      setLoggedOutUI();
    }
    return;
  }

  if (isLoggedIn()) {
    await onAuthenticated();
  } else {
    setLoggedOutUI();
  }
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const view = document.getElementById(`view-${viewName}`);
  const nav = document.querySelector(`[data-view="${viewName}"]`);
  if (view) view.classList.add('active');
  if (nav) nav.classList.add('active');

  if (viewTitle) {
    const titles = { dashboard: 'Dashboard', devices: 'Devices', agent: 'AI Agent', settings: 'Settings' };
    viewTitle.textContent = titles[viewName] || 'Dashboard';
  }
}

async function onAuthenticated() {
  try {
    const productInfo = await api.getUserProduct();
    currentUser = await api.getCurrentUser();
    isPremium = productInfo.isPremium;
    localStorage.setItem('spotify_user', JSON.stringify(currentUser));

    setLoggedInUI(productInfo);

    // Wire professional UI helpers + connector status
    updateDevModeBadge(isPremium);
    handlePremiumBanner(isPremium);
    updateSpotifyConnectorStatus(true, isPremium);

    if (!isPremium) {
      addMessage('agent', `Welcome, ${productInfo.display_name}!\n\n⚠️ Your account is on Spotify Free.\n\nFull playback control, transfer to iPhone, and the Web Playback device require Spotify Premium.\n\nYou can still:\n• Search tracks\n• View your library & top tracks\n• List available devices\n\nUpgrade to Premium to unlock the complete Harmony AI agent.`);
      if (agentStatus) {
        agentStatus.textContent = 'Free plan';
        agentStatus.classList.remove('online');
      }
    } else {
      addMessage('agent', `Welcome back, ${productInfo.display_name}! Premium detected. I'm ready to control your Spotify and transfer to iPhone.`);

      await player.initPlayer(
        (deviceId) => {
          currentDeviceId = deviceId;
          if (agentStatus) {
            agentStatus.textContent = 'Online';
            agentStatus.classList.add('online');
          }
          if (settingsSdk) settingsSdk.textContent = 'On';
          refreshDevices();
        },
        (state) => updateNowPlaying(state)
      );
    }

    await refreshDevices();
    try {
      const state = await api.getPlaybackState();
      if (state) updateNowPlayingFromApi(state);
    } catch (_) {}
  } catch (err) {
    console.error(err);
    addMessage('agent', `Error: ${err.message}`);
    if (err.message.includes('Session expired') || err.message.includes('Not authenticated')) {
      logout();
      setLoggedOutUI();
    }
  }
}

function setLoggedInUI(productInfo) {
  btnLogin?.classList.add('hidden');
  btnLogout?.classList.remove('hidden');
  userChip?.classList.remove('hidden');

  if (userName) userName.textContent = productInfo?.display_name || currentUser?.display_name || 'Connected';
  if (userPlan) {
    userPlan.textContent = productInfo?.isPremium ? 'Premium' : 'Free';
    userPlan.className = 'plan-badge ' + (productInfo?.isPremium ? 'premium' : 'free');
  }
  if (settingsAccount) settingsAccount.textContent = productInfo?.display_name || currentUser?.display_name || 'Connected';
  if (settingsPlan) {
    settingsPlan.textContent = productInfo?.isPremium ? 'Premium' : 'Free';
    settingsPlan.className = 'plan-badge ' + (productInfo?.isPremium ? 'premium' : 'free');
  }

  if (chatInput) chatInput.disabled = false;
  if (btnSend) btnSend.disabled = false;
}

function setLoggedOutUI() {
  btnLogin?.classList.remove('hidden');
  btnLogout?.classList.add('hidden');
  userChip?.classList.add('hidden');

  if (agentStatus) {
    agentStatus.textContent = 'Ready';
    agentStatus.classList.remove('online');
  }
  if (chatInput) chatInput.disabled = true;
  if (btnSend) btnSend.disabled = true;
  if (deviceList) deviceList.innerHTML = '<li class="muted">Connect Spotify to see devices</li>';
  if (activeDeviceName) activeDeviceName.textContent = 'No device';
  if (activeDeviceType) activeDeviceType.textContent = 'Connect Spotify to see devices';
  if (settingsAccount) settingsAccount.textContent = 'Not connected';
  if (settingsPlan) {
    settingsPlan.textContent = 'Free';
    settingsPlan.className = 'plan-badge free';
  }
  if (settingsSdk) settingsSdk.textContent = 'Off';

  // Reset professional UI helpers + connectors
  updateDevModeBadge(false);
  handlePremiumBanner(false);
  updateSpotifyConnectorStatus(false, false);
}

async function refreshDevices() {
  try {
    const data = await api.getDevices();
    devices = data.devices || [];
    renderDevices();

    // Update active device card
    const active = devices.find(d => d.is_active);
    if (active) {
      if (activeDeviceName) activeDeviceName.textContent = active.name;
      if (activeDeviceType) activeDeviceType.textContent = active.type;
    } else if (devices.length > 0) {
      if (activeDeviceName) activeDeviceName.textContent = devices[0].name;
      if (activeDeviceType) activeDeviceType.textContent = devices[0].type + ' (not active)';
    }
  } catch (err) {
    console.error('Devices error:', err);
  }
}

function renderDevices() {
  if (!deviceList) return;
  if (devices.length === 0) {
    deviceList.innerHTML = '<li class="muted">No devices found. Open Spotify on your phone or computer.</li>';
    return;
  }
  deviceList.innerHTML = devices.map(d => `
    <li class="${d.is_active ? 'active' : ''}" data-id="${d.id}">
      <span>${d.name} <small>(${d.type})</small></span>
      ${d.is_active ? '<span>●</span>' : ''}
    </li>
  `).join('');

  deviceList.querySelectorAll('li[data-id]').forEach(li => {
    li.addEventListener('click', async () => {
      try {
        await api.transferPlayback(li.dataset.id, true);
        addMessage('agent', `Transferred to “${li.textContent.trim()}”.`);
        setTimeout(refreshDevices, 1200);
      } catch (e) {
        addMessage('agent', `Transfer failed: ${e.message}`);
      }
    });
  });
}

async function handleChatSubmit(e) {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage('user', text);
  chatInput.value = '';
  try {
    const result = await processMessage(text, { user: currentUser, devices, currentDeviceId });
    addMessage('agent', result.reply);
  } catch (err) {
    addMessage('agent', `Error: ${err.message}`);
  }
}

async function handleQuickAction(action) {
  const map = {
    'play-top': 'play my top tracks',
    'recent': 'recently played',
    'list-devices': 'list devices',
    'transfer-self': 'transfer to this agent',
    'transfer-iphone': 'transfer to iPhone 17 Pro',
    'transfer-tws': 'transfer to my headphones',
    'help': 'help'
  };
  const cmd = map[action];
  if (!cmd) return;

  // Switch to agent view for chat commands
  if (['play-top', 'recent', 'list-devices', 'help'].includes(action)) {
    switchView('agent');
  }

  addMessage('user', cmd);
  try {
    const result = await processMessage(cmd, { user: currentUser, devices, currentDeviceId });
    addMessage('agent', result.reply);
  } catch (err) {
    addMessage('agent', `Error: ${err.message}`);
  }
}

function addMessage(role, text) {
  if (!chatMessages) return;
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateNowPlaying(state) {
  if (!state || !state.track_window?.current_track) return;
  const track = state.track_window.current_track;
  if (trackName) trackName.textContent = track.name;
  if (trackArtist) trackArtist.textContent = track.artists.map(a => a.name).join(', ');
  if (trackArt && track.album?.images?.[0]) {
    trackArt.src = track.album.images[0].url;
    trackArt.classList.remove('hidden');
  }
  if (btnPlay) btnPlay.textContent = state.paused ? '▶️' : '⏸';
}

function updateNowPlayingFromApi(state) {
  if (!state?.item) return;
  if (trackName) trackName.textContent = state.item.name;
  if (trackArtist) trackArtist.textContent = state.item.artists.map(a => a.name).join(', ');
  if (trackArt && state.item.album?.images?.[0]) {
    trackArt.src = state.item.album.images[0].url;
    trackArt.classList.remove('hidden');
  }
}
