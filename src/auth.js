/**
 * Harmony AI – Spotify Authentication Module
 * Uses Authorization Code Flow with PKCE
 * Includes clear error handling for missing Client ID
 */

const CLIENT_ID = (import.meta.env.VITE_SPOTIFY_CLIENT_ID || '').trim();
const PLACEHOLDER_IDS = new Set(['', 'YOUR_CLIENT_ID_HERE', 'your_client_id_here', 'undefined', 'null']);

// Automatically use current origin in production (Vercel) or local for development
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI
  || (typeof window !== 'undefined' ? `${window.location.origin}/callback` : 'http://127.0.0.1:5173/callback');

const SCOPES = [
  'user-read-private',
  'user-read-email',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'playlist-read-private',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-top-read',
  'user-read-recently-played'
].join(' ');

/**
 * Returns true when a real Spotify Client ID is configured
 */
export function hasValidClientId() {
  return Boolean(CLIENT_ID) && !PLACEHOLDER_IDS.has(CLIENT_ID);
}

/**
 * Human-readable config error for missing key
 */
export function getConfigError() {
  if (hasValidClientId()) return null;
  return {
    code: 'MISSING_SPOTIFY_CLIENT_ID',
    title: 'Spotify Client ID not configured',
    message:
      'VITE_SPOTIFY_CLIENT_ID is missing. ' +
      'Add it in Vercel → Project Settings → Environment Variables, then redeploy. ' +
      'Also add this Redirect URI in the Spotify Dashboard: ' + REDIRECT_URI,
    redirectUri: REDIRECT_URI
  };
}

function generateRandomString(length) {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export async function login() {
  const configError = getConfigError();
  if (configError) {
    // Surface a clear error instead of redirecting to Spotify with an invalid client_id
    const err = new Error(configError.message);
    err.code = configError.code;
    err.meta = configError;
    throw err;
  }

  const verifier = generateRandomString(64);
  const challenge = await generateCodeChallenge(verifier);
  localStorage.setItem('spotify_code_verifier', verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    show_dialog: 'true'
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code) {
  if (!hasValidClientId()) {
    throw new Error(getConfigError().message);
  }

  const verifier = localStorage.getItem('spotify_code_verifier');
  if (!verifier) throw new Error('Missing code_verifier. Please login again.');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const detail = err.error_description || err.error || 'Token exchange failed';
    if (String(detail).toLowerCase().includes('invalid client')) {
      throw new Error(
        'Invalid Spotify Client ID. Check VITE_SPOTIFY_CLIENT_ID in Vercel Environment Variables and redeploy.'
      );
    }
    throw new Error(detail);
  }

  const data = await response.json();
  saveTokens(data);
  return data;
}

export async function refreshAccessToken() {
  if (!hasValidClientId()) {
    logout();
    throw new Error(getConfigError().message);
  }

  const refreshToken = localStorage.getItem('spotify_refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  });

  if (!response.ok) {
    logout();
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();
  saveTokens({
    access_token: data.access_token,
    refresh_token: data.refresh_token || refreshToken,
    expires_in: data.expires_in
  });
  return data;
}

function saveTokens(data) {
  localStorage.setItem('spotify_access_token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh_token', data.refresh_token);
  }
  const expiresAt = Date.now() + (data.expires_in * 1000) - 60000;
  localStorage.setItem('spotify_expires_at', expiresAt.toString());
}

export async function getValidAccessToken() {
  const token = localStorage.getItem('spotify_access_token');
  const expiresAt = parseInt(localStorage.getItem('spotify_expires_at') || '0', 10);

  if (!token) return null;

  if (Date.now() >= expiresAt) {
    const refreshed = await refreshAccessToken();
    return refreshed.access_token;
  }
  return token;
}

export function logout() {
  localStorage.removeItem('spotify_access_token');
  localStorage.removeItem('spotify_refresh_token');
  localStorage.removeItem('spotify_expires_at');
  localStorage.removeItem('spotify_code_verifier');
  localStorage.removeItem('spotify_user');
}

export function isLoggedIn() {
  return !!localStorage.getItem('spotify_access_token');
}

export function getClientId() {
  return hasValidClientId() ? CLIENT_ID : null;
}

export function getRedirectUri() {
  return REDIRECT_URI;
}
