/**
 * Integration tests – Auth config & missing keys
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Auth config helpers', () => {
  beforeEach(() => {
    vi.resetModules();
    if (typeof localStorage !== 'undefined') localStorage.clear();
  });

  it('detects missing client id as invalid', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');
    const { hasValidClientId, getConfigError } = await import('../src/auth.js');
    expect(hasValidClientId()).toBe(false);
    const err = getConfigError();
    expect(err).not.toBeNull();
    expect(err.code).toBe('MISSING_SPOTIFY_CLIENT_ID');
    expect(err.message).toMatch(/VITE_SPOTIFY_CLIENT_ID/i);
  });

  it('rejects placeholder client id', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'YOUR_CLIENT_ID_HERE');
    const { hasValidClientId } = await import('../src/auth.js');
    expect(hasValidClientId()).toBe(false);
  });

  it('accepts a real-looking client id', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'abcd1234efgh5678ijkl');
    const { hasValidClientId, getConfigError, getClientId } = await import('../src/auth.js');
    expect(hasValidClientId()).toBe(true);
    expect(getConfigError()).toBeNull();
    expect(getClientId()).toBe('abcd1234efgh5678ijkl');
  });

  it('login throws when client id is missing', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', '');
    const { login } = await import('../src/auth.js');
    await expect(login()).rejects.toThrow(/VITE_SPOTIFY_CLIENT_ID/i);
  });

  it('isLoggedIn is false with empty storage', async () => {
    vi.stubEnv('VITE_SPOTIFY_CLIENT_ID', 'testclient');
    const { isLoggedIn, logout } = await import('../src/auth.js');
    logout();
    expect(isLoggedIn()).toBe(false);
  });
});
