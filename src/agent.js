/**
 * Harmony AI – Smart Human-like Agent
 * -----------------------------------
 * Natural, conversational responses.
 * Expanded intents + continuous playback awareness ready.
 * OrgSuite Edition
 */

import * as api from './spotify-api.js';
import * as player from './player.js';

/**
 * Main entry – human-style replies
 */
export async function processMessage(userMessage, context = {}) {
  const raw = (userMessage || '').trim();
  const msg = raw.toLowerCase();
  const devices = context.devices || [];
  const userName = context.user?.display_name?.split(' ')[0] || 'friend';

  if (!msg) {
    return { reply: `Hey ${userName}! What can I do for you? Try “what’s playing”, “play something chill”, or “move this to my phone”.` };
  }

  // ── Greeting / small talk ──────────────────────
  if (/^(hi|hello|hey|yo|sup|good morning|good evening)/.test(msg)) {
    return { reply: `Hey ${userName}! 👋 Ready when you are. Want me to check what’s playing, transfer to your phone, or queue something up?` };
  }

  if (msg.includes('thank') || msg.includes('thanks')) {
    return { reply: `Anytime! Just say the word if you need anything else.` };
  }

  if (msg.includes('how are you') || msg.includes('what’s up') || msg.includes('whats up')) {
    return { reply: `I’m good — locked in and watching your Spotify. What should we do next?` };
  }

  // ── What’s playing / now playing ───────────────
  if (msg.includes('what’s playing') || msg.includes('whats playing') || msg.includes('now playing') || msg.includes('current song') || msg.includes('what is this')) {
    try {
      const state = await api.getPlaybackState();
      if (!state || !state.item) {
        return { reply: `Nothing is playing right now. Want me to start something?` };
      }
      const track = state.item;
      const artists = track.artists.map(a => a.name).join(', ');
      const device = state.device?.name || 'unknown device';
      return { reply: `Right now it’s “${track.name}” by ${artists} on ${device}.` };
    } catch (e) {
      return { reply: `I couldn’t check the current track. Make sure Spotify is open somewhere.` };
    }
  }

  // ── List devices ───────────────────────────────
  if (msg.includes('list devices') || msg.includes('show devices') || msg === 'devices' || msg.includes('where can i play')) {
    if (devices.length === 0) {
      return { reply: `I don’t see any devices yet. Open Spotify on your phone or computer and I’ll pick them up.` };
    }
    const list = devices.map(d => `• ${d.name} (${d.type})${d.is_active ? ' ← currently active' : ''}`).join('\n');
    return { reply: `Here’s what I can see:\n${list}\n\nJust say “play on my phone” or name any device.` };
  }

  // ── Transfer / play on ─────────────────────────
  if (msg.includes('transfer') || msg.includes('play on') || msg.includes('switch to') || msg.includes('move to') || msg.includes('send to')) {
    return handleTransfer(msg, devices, context.currentDeviceId, userName);
  }

  // ── Top tracks ─────────────────────────────────
  if (msg.includes('top tracks') || msg.includes('my top') || msg.includes('top songs') || msg.includes('favorites')) {
    try {
      const data = await api.getTopTracks('medium_term', 8);
      const tracks = data.items || [];
      if (tracks.length === 0) return { reply: `I couldn’t find top tracks yet. Listen a bit more and try again.` };
      const list = tracks.slice(0, 5).map((t, i) => `${i + 1}. ${t.name} – ${t.artists[0].name}`).join('\n');
      return { reply: `These are your current favorites:\n${list}\n\nWant me to play any of them?` };
    } catch (e) {
      return { reply: `Had trouble pulling your top tracks. ${e.message}` };
    }
  }

  // ── Recently played ────────────────────────────
  if (msg.includes('recent') || msg.includes('recently played') || msg.includes('last played') || msg.includes('history')) {
    try {
      const data = await api.getRecentlyPlayed(8);
      const items = data.items || [];
      if (items.length === 0) return { reply: `No recent plays showing up.` };
      const list = items.slice(0, 5).map((item, i) => `${i + 1}. ${item.track.name} – ${item.track.artists[0].name}`).join('\n');
      return { reply: `Here’s what you’ve been playing lately:\n${list}` };
    } catch (e) {
      return { reply: `Couldn’t load recent tracks right now.` };
    }
  }

  // ── Pause / stop / resume ──────────────────────
  if (msg.includes('pause') || msg.includes('stop the music') || msg === 'stop') {
    try {
      await api.pausePlayback();
      return { reply: `Paused.` };
    } catch (e) {
      return { reply: `Couldn’t pause — this usually needs Premium. (${e.message})` };
    }
  }

  if (msg.includes('resume') || msg.includes('continue') || msg === 'play' || msg.includes('unpause')) {
    try {
      await api.startPlayback({});
      return { reply: `Resuming playback.` };
    } catch (e) {
      return { reply: `Couldn’t resume. Premium is required for playback control.` };
    }
  }

  if (msg.includes('next') || msg.includes('skip')) {
    try {
      await api.skipToNext();
      return { reply: `Skipped to the next track.` };
    } catch (e) {
      return { reply: `Couldn’t skip — Premium needed for that.` };
    }
  }

  if (msg.includes('previous') || msg.includes('go back') || msg.includes('last song')) {
    try {
      await api.skipToPrevious();
      return { reply: `Went back to the previous track.` };
    } catch (e) {
      return { reply: `Couldn’t go back. Premium is required.` };
    }
  }

  // ── Search & play ──────────────────────────────
  if (msg.startsWith('play ') || msg.startsWith('search ') || msg.includes('put on ') || msg.includes('queue ')) {
    const query = msg
      .replace(/^(play|search|put on|queue)\s+/i, '')
      .replace(/\s+on\s+(my\s+)?(phone|iphone|desktop|computer).*$/i, '')
      .trim();

    if (!query) return { reply: `What should I play?` };

    try {
      const results = await api.search(query, ['track'], 5);
      const tracks = results.tracks?.items || [];
      if (tracks.length === 0) return { reply: `I couldn’t find anything for “${query}”. Try a different name?` };

      const top = tracks[0];
      try {
        await api.startPlayback({ uris: [top.uri] });
        return { reply: `Got it — playing “${top.name}” by ${top.artists[0].name}.` };
      } catch (e) {
        return { reply: `Found “${top.name}” by ${top.artists[0].name}, but playback needs Premium. You can still see it in search.` };
      }
    } catch (e) {
      return { reply: `Search failed: ${e.message}` };
    }
  }

  // ── Volume ─────────────────────────────────────
  if (msg.includes('volume') || msg.includes('louder') || msg.includes('quieter') || msg.includes('turn it up') || msg.includes('turn it down')) {
    return { reply: `I can adjust volume when Premium is active and the Web Playback device is connected. For now use the volume slider on the dashboard.` };
  }

  // ── Help ───────────────────────────────────────
  if (msg.includes('help') || msg === '?' || msg.includes('what can you do')) {
    return {
      reply: `Here’s what I can do right now:\n\n• Tell you what’s playing\n• List all your devices\n• Transfer to iPhone / this browser / desktop\n• Show your top tracks & recently played\n• Search and try to play songs\n• Pause / resume / skip (Premium)\n\nJust talk to me normally — “play some lo-fi”, “move this to my phone”, “what’s playing?”`
    };
  }

  // ── Fallback – still human ─────────────────────
  return {
    reply: `I’m not sure I got that, ${userName}. Try something like “what’s playing”, “play on my phone”, “my top tracks”, or “help”.`
  };
}

/**
 * Human-friendly device transfer
 */
async function handleTransfer(msg, devices, currentDeviceId, userName) {
  if (devices.length === 0) {
    return { reply: `I don’t see any devices yet. Open Spotify on your phone or computer first.` };
  }

  let target = null;

  // iPhone priority
  if (msg.includes('iphone 17 pro') || msg.includes('iphone 17')) {
    target = devices.find(d => d.name.toLowerCase().includes('iphone 17'));
  }
  if (!target && (msg.includes('phone') || msg.includes('iphone') || msg.includes('smartphone'))) {
    target = devices.find(d => d.type === 'Smartphone' || d.name.toLowerCase().includes('iphone'));
  }
  if (!target && (msg.includes('this') || msg.includes('agent') || msg.includes('browser') || msg.includes('harmony') || msg.includes('here'))) {
    target = devices.find(d => d.id === currentDeviceId) || devices.find(d => d.name.toLowerCase().includes('harmony'));
  }
  if (!target && (msg.includes('desktop') || msg.includes('computer') || msg.includes('mac') || msg.includes('pc') || msg.includes('laptop'))) {
    target = devices.find(d => d.type === 'Computer');
  }
  if (!target) {
    target = devices.find(d => msg.includes(d.name.toLowerCase()));
  }

  if (target) {
    try {
      await api.transferPlayback(target.id, true);
      return { reply: `Done — moved playback to “${target.name}”.` };
    } catch (e) {
      return { reply: `I tried to move it to “${target.name}” but it failed. ${e.message}. This usually needs Premium.` };
    }
  }

  const names = devices.map(d => d.name).join(', ');
  return { reply: `I can move it to any of these: ${names}. Just tell me which one.` };
}
