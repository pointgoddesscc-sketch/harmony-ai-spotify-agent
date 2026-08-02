/**
 * Integration tests – Agent natural language handling
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/spotify-api.js', () => ({
  getPlaybackState: vi.fn(),
  getTopTracks: vi.fn(),
  getRecentlyPlayed: vi.fn(),
  search: vi.fn(),
  startPlayback: vi.fn(),
  pausePlayback: vi.fn(),
  skipToNext: vi.fn(),
  skipToPrevious: vi.fn(),
  transferPlayback: vi.fn(),
  getDevices: vi.fn()
}));

vi.mock('../src/player.js', () => ({
  togglePlay: vi.fn(),
  nextTrack: vi.fn(),
  previousTrack: vi.fn(),
  setVolume: vi.fn(),
  initPlayer: vi.fn(),
  disconnect: vi.fn()
}));

import { processMessage } from '../src/agent.js';
import * as api from '../src/spotify-api.js';

describe('Agent processMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('replies helpfully to empty message', async () => {
    const res = await processMessage('', { user: { display_name: 'Org' } });
    expect(res.reply).toMatch(/hey|play|phone/i);
  });

  it('handles greeting', async () => {
    const res = await processMessage('hello', { user: { display_name: 'Org Suite' } });
    expect(res.reply.toLowerCase()).toMatch(/hey|ready|org/i);
  });

  it('handles help', async () => {
    const res = await processMessage('help');
    expect(res.reply.toLowerCase()).toMatch(/device|play|track/i);
  });

  it('lists devices when available', async () => {
    const devices = [
      { id: '1', name: 'iPhone 17 Pro', type: 'Smartphone', is_active: true },
      { id: '2', name: 'Harmony AI Agent', type: 'Computer', is_active: false }
    ];
    const res = await processMessage('list devices', { devices });
    expect(res.reply).toMatch(/iPhone 17 Pro/);
    expect(res.reply).toMatch(/Harmony AI Agent/);
  });

  it('reports no devices gracefully', async () => {
    const res = await processMessage('list devices', { devices: [] });
    expect(res.reply.toLowerCase()).toMatch(/no devices|don't see|open spotify/i);
  });

  it('returns top tracks from API', async () => {
    api.getTopTracks.mockResolvedValue({
      items: [
        { name: 'Song A', artists: [{ name: 'Artist A' }] },
        { name: 'Song B', artists: [{ name: 'Artist B' }] }
      ]
    });
    const res = await processMessage('my top tracks');
    expect(res.reply).toMatch(/Song A/);
    expect(api.getTopTracks).toHaveBeenCalled();
  });

  it('handles transfer to phone', async () => {
    const devices = [
      { id: 'phone1', name: 'iPhone 17 Pro', type: 'Smartphone', is_active: false }
    ];
    api.transferPlayback.mockResolvedValue({});
    const res = await processMessage('transfer to iPhone', { devices });
    expect(api.transferPlayback).toHaveBeenCalledWith('phone1', true);
    expect(res.reply.toLowerCase()).toMatch(/moved|transferred|done/i);
  });

  it('explains premium when play fails', async () => {
    api.search.mockResolvedValue({
      tracks: { items: [{ name: 'Test Track', artists: [{ name: 'T' }], uri: 'spotify:track:1' }] }
    });
    api.startPlayback.mockRejectedValue(new Error('Premium required'));
    const res = await processMessage('play test track');
    expect(res.reply.toLowerCase()).toMatch(/premium|found/i);
  });
});
