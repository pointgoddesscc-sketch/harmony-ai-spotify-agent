/**
 * Edge chat helper tests
 */
import { describe, it, expect } from 'vitest';

function normalizeKey(msg) {
  return msg.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 120);
}

function localEdgeReply(msg, context = {}) {
  const m = msg.toLowerCase();
  const name = context.user?.display_name?.split(' ')[0] || 'friend';
  if (/^(hi|hello|hey|yo|sup)/.test(m)) {
    return `Hey ${name}! Ready when you are. What should we play or transfer?`;
  }
  if (m.includes('help') || m === '?') {
    return 'I can help with devices, tracks, and playback.';
  }
  if (m.includes('premium')) {
    return 'Full Web Playback needs Spotify Premium.';
  }
  return `Got it, ${name}.`;
}

describe('Edge chat helpers', () => {
  it('normalizes cache keys', () => {
    expect(normalizeKey('  Help  ME  ')).toBe('help me');
    expect(normalizeKey('A'.repeat(200)).length).toBe(120);
  });

  it('greets by first name', () => {
    const r = localEdgeReply('hello', { user: { display_name: 'Org Suite' } });
    expect(r).toMatch(/Hey Org/);
  });

  it('answers help', () => {
    expect(localEdgeReply('help')).toMatch(/devices|tracks|playback/i);
  });

  it('mentions premium when asked', () => {
    expect(localEdgeReply('do I need premium')).toMatch(/Premium/i);
  });
});
