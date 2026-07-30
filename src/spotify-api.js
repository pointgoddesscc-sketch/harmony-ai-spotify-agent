/**
 * Harmony AI – Spotify Web API Client
 * Handles all REST calls with automatic token refresh.
 * Includes full Spotify Connect device management.
 *
 * Official docs: https://developer.spotify.com/documentation/web-api
 */

import { getValidAccessToken, logout } from './auth.js';

const BASE = 'https://api.spotify.com/v1';

/**
 * Generic authenticated fetch with automatic retry on 401
 * @param {string} endpoint
 * @param {object} options
 * @returns {Promise<any>}
 */
async function api(endpoint, options = {}) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    logout();
    throw new Error('Session expired. Please reconnect Spotify.');
  }

  if (res.status === 204) return null;

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Spotify API error ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────
// User Profile
// ─────────────────────────────────────────────

export async function getCurrentUser() {
  return api('/me');
}

/**
 * Detect if the user is on Spotify Free or Premium.
 * Web Playback SDK + most Player endpoints require Premium.
 * @returns {Promise<{isPremium: boolean, product: string, display_name: string, id: string}>}
 */
export async function getUserProduct() {
  const user = await getCurrentUser();
  const product = user.product || 'free';
  return {
    isPremium: product === 'premium',
    product,
    display_name: user.display_name || 'User',
    id: user.id
  };
}

// ─────────────────────────────────────────────
// Playback & Spotify Connect Device Management
// ─────────────────────────────────────────────

export async function getDevices() {
  return api('/me/player/devices');
}

export async function getPlaybackState() {
  return api('/me/player');
}

export async function transferPlayback(deviceId, play = true) {
  return api('/me/player', {
    method: 'PUT',
    body: JSON.stringify({
      device_ids: [deviceId],
      play
    })
  });
}

export async function startPlayback(options = {}) {
  const { device_id, ...body } = options;
  const query = device_id ? `?device_id=${device_id}` : '';
  return api(`/me/player/play${query}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
}

export async function pausePlayback(deviceId) {
  const query = deviceId ? `?device_id=${deviceId}` : '';
  return api(`/me/player/pause${query}`, { method: 'PUT' });
}

export async function skipToNext(deviceId) {
  const query = deviceId ? `?device_id=${deviceId}` : '';
  return api(`/me/player/next${query}`, { method: 'POST' });
}

export async function skipToPrevious(deviceId) {
  const query = deviceId ? `?device_id=${deviceId}` : '';
  return api(`/me/player/previous${query}`, { method: 'POST' });
}

export async function setVolume(volumePercent, deviceId) {
  const query = `?volume_percent=${Math.round(volumePercent * 100)}${deviceId ? `&device_id=${deviceId}` : ''}`;
  return api(`/me/player/volume${query}`, { method: 'PUT' });
}

// ─────────────────────────────────────────────
// Search & Content
// ─────────────────────────────────────────────

export async function search(query, types = ['track'], limit = 10) {
  const params = new URLSearchParams({
    q: query,
    type: types.join(','),
    limit: limit.toString()
  });
  return api(`/search?${params}`);
}

export async function getTopTracks(timeRange = 'medium_term', limit = 20) {
  return api(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
}

export async function getRecentlyPlayed(limit = 20) {
  return api(`/me/player/recently-played?limit=${limit}`);
}

// ─────────────────────────────────────────────
// Playlists
// ─────────────────────────────────────────────

export async function createPlaylist(userId, name, description = '', isPublic = false) {
  return api(`/users/${userId}/playlists`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      public: isPublic
    })
  });
}

export async function addTracksToPlaylist(playlistId, uris) {
  return api(`/playlists/${playlistId}/tracks`, {
    method: 'POST',
    body: JSON.stringify({ uris })
  });
}

export async function getUserPlaylists(limit = 20) {
  return api(`/me/playlists?limit=${limit}`);
}
