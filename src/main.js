/**
 * Harmony AI – Main Application Entry
 * Orchestrates Auth, Web Playback SDK, Device Management, Chat UI & Agent.
 */

import { login, logout, isLoggedIn, exchangeCodeForToken } from './auth.js';
import * as api from './spotify-api.js';
import * as player from './player.js';
import { processMessage } from './agent.js';

// DOM elements
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const userInfo = document.getElementById('user-info');
const agentStatus = document.getElementById('agent-status');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const btnSend = document.getElementById('btn-send');
const deviceList = document.getElementById('device-list');
const btnRefreshDevices = document.getElementById('btn-refresh-devices');
const trackName = document.getElementById('track-name');
const trackArtist = document.getElementById('track-artist');
const trackArt = document.getElementById('track-art');
const btnPlay = document.getElementById('btn-play');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const volumeSlider = document.getElementById('volume');

let currentUser = null;
let currentDeviceId = null;
let devices = [];

// ── Bootstrap ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

async function init() {
  btnLogin?.addEventListener('click', () => login());
  btnLogout?.addEventListener('click', () => {
    logout();
    player.disconnect();
    setLoggedOutUI();
    addMessage('agent', 'Disconnected. Click Connect Spotify to start again.');
  });

  chatForm?.addEventListener('submit', handleChatSubmit);
  btnRefreshDevices?.addEventListener('click', refreshDevices);
  btnPlay?.addEventListener('click', () => player.togglePlay());
  btnPrev?.addEventListener('click', () => player.previousTrack());
  btnNext?.addEventListener('click', () => player.nextTrack());
  volumeSlider?.addEventListener('input', (e) => player.setVolume(parseFloat(e.target.value)));

  // Quick actions
  document.querySelectorAll('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => handleQuickAction(btn.dataset.action));
  });

  // Handle OAuth callback
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (code) {
    try {
      agentStatus.textContent = 'Authenticating...';
      await exchangeCodeForToken(code);
      window.history.replaceState({}, document.title, '/');
      await onAuthenticated();
    } catch (err) {
      addMessage('agent', `Login error: ${err.message}`);
    }
    return;
  }

  if (isLoggedIn()) {
    await onAuthenticated();
  } else {
    setLoggedOutUI();
  }
}

async function onAuthenticated() {
  try {
    const productInfo = await api.getUserProduct();
    currentUser = await api.getCurrentUser();
    localStorage.setItem('spotify_user', JSON.stringify(currentUser));

    setLoggedInUI();

    if (!productInfo.isPremium) {
      addMessage('agent', `Welcome, ${productInfo.display_name}!\n\n⚠️ Your account is on Spotify Free.\n\nFull playback control, transfer to iPhone, and the Web Playback device require Spotify Premium.\n\nYou can still:\n• Search tracks\n• View your library & top tracks\n• List available devices\n\nUpgrade to Premium to unlock the complete Harmony AI agent.`);
      agentStatus.textContent = 'Free plan';
      agentStatus.classList.remove('online');
    } else {
      addMessage('agent', `Welcome back, ${productInfo.display_name}! Premium detected. I'm ready to control your Spotify and transfer to iPhone.`);

      await player.initPlayer(
        (deviceId) => {
          currentDeviceId = deviceId;
          agentStatus.textContent = 'Online';
          agentStatus.classList.add('online');
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

function setLoggedInUI() {
  btnLogin?.classList.add('hidden');
  btnLogout?.classList.remove('hidden');
  userInfo?.classList.remove('hidden');
  if (userInfo && currentUser) userInfo.textContent = currentUser.display_name || 'Connected';
  chatInput.disabled = false;
  btnSend.disabled = false;
}

function setLoggedOutUI() {
  btnLogin?.classList.remove('hidden');
  btnLogout?.classList.add('hidden');
  userInfo?.classList.add('hidden');
  agentStatus.textContent = 'Ready';
  agentStatus.classList.remove('online');
  chatInput.disabled = true;
  btnSend.disabled = true;
  deviceList.innerHTML = '<li class="muted">Connect Spotify to see devices</li>';
}

async function refreshDevices() {
  try {
    const data = await api.getDevices();
    devices = data.devices || [];
    renderDevices();
  } catch (err) {
    console.error('Devices error:', err);
  }
}

function renderDevices() {
  if (!deviceList) return;
  if (devices.length === 0) {
    deviceList.innerHTML = '<li class="muted">No devices found</li>';
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
        setTimeout(refreshDevices, 1000);
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
  if (action === 'play-top') {
    await handleChatSubmit({ preventDefault: () => {}, target: null });
    chatInput.value = 'play my top tracks';
    chatForm.dispatchEvent(new Event('submit'));
  } else if (action === 'recent') {
    chatInput.value = 'recently played';
    chatForm.dispatchEvent(new Event('submit'));
  } else if (action === 'transfer-self') {
    chatInput.value = 'transfer to this agent';
    chatForm.dispatchEvent(new Event('submit'));
  } else if (action === 'transfer-iphone') {
    chatInput.value = 'transfer to iPhone 17 Pro';
    chatForm.dispatchEvent(new Event('submit'));
  }
}

function addMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.innerHTML = `<div class="bubble">${text.replace(/\n/g, '<br>')}</div>`;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateNowPlaying(state) {
  if (!state || !state.track_window?.current_track) return;
  const track = state.track_window.current_track;
  trackName.textContent = track.name;
  trackArtist.textContent = track.artists.map(a => a.name).join(', ');
  if (track.album?.images?.[0]) {
    trackArt.src = track.album.images[0].url;
    trackArt.classList.remove('hidden');
  }
  btnPlay.textContent = state.paused ? '▶️' : '⏸';
}

function updateNowPlayingFromApi(state) {
  if (!state?.item) return;
  trackName.textContent = state.item.name;
  trackArtist.textContent = state.item.artists.map(a => a.name).join(', ');
  if (state.item.album?.images?.[0]) {
    trackArt.src = state.item.album.images[0].url;
    trackArt.classList.remove('hidden');
  }
}
