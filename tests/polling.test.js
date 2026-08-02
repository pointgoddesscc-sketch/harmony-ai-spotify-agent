/**
 * Integration tests – Real-time polling lifecycle
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startPolling, stopPolling, isPollingActive } from '../src/polling.js';

describe('Polling module', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stopPolling();
  });

  afterEach(() => {
    stopPolling();
    vi.useRealTimers();
  });

  it('starts and stops cleanly', () => {
    expect(isPollingActive()).toBe(false);
    startPolling({
      fetchPlayback: vi.fn().mockResolvedValue(null),
      onPlayback: vi.fn(),
      onDevices: vi.fn()
    });
    expect(isPollingActive()).toBe(true);
    stopPolling();
    expect(isPollingActive()).toBe(false);
  });

  it('calls fetchPlayback on tick', async () => {
    const fetchPlayback = vi.fn().mockResolvedValue({ item: { name: 'X' } });
    const onPlayback = vi.fn();
    startPolling({ fetchPlayback, onPlayback, onDevices: vi.fn() });
    await vi.advanceTimersByTimeAsync(1500);
    expect(fetchPlayback).toHaveBeenCalled();
    expect(onPlayback).toHaveBeenCalled();
  });

  it('does not throw when fetchPlayback rejects', async () => {
    const fetchPlayback = vi.fn().mockRejectedValue(new Error('network'));
    startPolling({ fetchPlayback, onPlayback: vi.fn(), onDevices: vi.fn() });
    await vi.advanceTimersByTimeAsync(1500);
    expect(fetchPlayback).toHaveBeenCalled();
    expect(isPollingActive()).toBe(true);
  });
});
