/**
 * Integration tests – Connector status monitoring
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { renderConnectors, updateSpotifyConnectorStatus } from '../src/connectors.js';

describe('Connectors', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="connectors-list"></div>';
  });

  it('renders all expected connectors', () => {
    renderConnectors();
    const rows = document.querySelectorAll('.connector-row');
    expect(rows.length).toBeGreaterThanOrEqual(4);
    const text = document.body.textContent;
    expect(text).toMatch(/Gmail/i);
    expect(text).toMatch(/Calendar/i);
    expect(text).toMatch(/Spotify/i);
  });

  it('updates Spotify status on login (free)', () => {
    renderConnectors();
    updateSpotifyConnectorStatus(true, false);
    const row = document.querySelector('[data-id="spotify"]');
    expect(row).toBeTruthy();
    expect(row.textContent).toMatch(/Free|Connected/i);
  });

  it('updates Spotify status on premium', () => {
    renderConnectors();
    updateSpotifyConnectorStatus(true, true);
    const row = document.querySelector('[data-id="spotify"]');
    expect(row.textContent).toMatch(/Premium/i);
  });

  it('updates Spotify status on logout', () => {
    renderConnectors();
    updateSpotifyConnectorStatus(false, false);
    const row = document.querySelector('[data-id="spotify"]');
    expect(row.textContent).toMatch(/Not connected/i);
  });
});
