/**
 * Harmony AI – Web Playback SDK Manager
 * Turns this browser tab into a full Spotify Connect device.
 * Works on Desktop browsers and can transfer to/from the official Desktop app + iPhone.
 *
 * Docs: https://developer.spotify.com/documentation/web-playback-sdk
 */

import { getValidAccessToken } from './auth.js';

let player = null;
let deviceId = null;
let onStateChangeCallback = null;

export async function initPlayer(onReady, onStateChange) {
  onStateChangeCallback = onStateChange;

  if (!window.Spotify) {
    await new Promise(resolve => {
      window.onSpotifyWebPlaybackSDKReady = resolve;
    });
  }

  const token = await getValidAccessToken();
  if (!token) {
    console.warn('Cannot init player – not authenticated');
    return;
  }

  player = new Spotify.Player({
    name: 'Harmony AI Agent',
    getOAuthToken: async (cb) => {
      const fresh = await getValidAccessToken();
      cb(fresh);
    },
    volume: 0.7
  });

  player.addListener('ready', ({ device_id }) => {
    console.log('[Harmony] Web Playback device ready:', device_id);
    deviceId = device_id;
    if (onReady) onReady(device_id);
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.log('[Harmony] Device went offline:', device_id);
    if (deviceId === device_id) deviceId = null;
  });

  player.addListener('player_state_changed', (state) => {
    if (onStateChangeCallback) onStateChangeCallback(state);
  });

  player.addListener('initialization_error', ({ message }) => {
    console.error('[Harmony] Init error:', message);
  });

  player.addListener('authentication_error', ({ message }) => {
    console.error('[Harmony] Auth error:', message);
  });

  player.addListener('account_error', ({ message }) => {
    console.error('[Harmony] Account error (Premium required):', message);
  });

  player.addListener('playback_error', ({ message }) => {
    console.error('[Harmony] Playback error:', message);
  });

  const success = await player.connect();
  if (!success) {
    console.error('[Harmony] Failed to connect Web Playback SDK');
  }
}

export function getDeviceId() {
  return deviceId;
}

export async function togglePlay() {
  if (!player) return;
  await player.togglePlay();
}

export async function nextTrack() {
  if (!player) return;
  await player.nextTrack();
}

export async function previousTrack() {
  if (!player) return;
  await player.previousTrack();
}

export async function setVolume(volume) {
  if (!player) return;
  await player.setVolume(volume);
}

export async function getCurrentState() {
  if (!player) return null;
  return player.getCurrentState();
}

export function activateElement() {
  if (player) player.activateElement();
}

export function disconnect() {
  if (player) {
    player.disconnect();
    player = null;
    deviceId = null;
  }
}
