# Harmony AI – Spotify Music Agent

**Vanilla JS + Vite + PKCE + Web Playback SDK + Spotify Connect + iPhone 17 Pro logic**

Private working copy for Codex / ChatGPT / GitHub Copilot.

## Features
- Authorization Code + PKCE
- Web Playback SDK (Premium)
- Full Spotify Connect device list + transfer
- Smart iPhone / iPhone 17 Pro detection
- Natural language chat agent
- **Free account detection + graceful fallback**
- Ready for Vercel deployment

## Important – Spotify Free vs Premium
Your current account is **Spotify Free**.

| Feature | Free | Premium |
|---------|------|---------|
| Login & search | Yes | Yes |
| List devices | Yes | Yes |
| Transfer / Play / Web Playback SDK | No | Yes |

Upgrade to Premium to unlock full agent power.

## Quick Start
1. Create app at https://developer.spotify.com/dashboard
2. Add Redirect URI: `http://127.0.0.1:5173/callback` (and later your Vercel URL)
3. Copy Client ID
4. `cp .env.example .env` and paste Client ID
5. `npm install && npm run dev`

## Deploy to Vercel
```bash
npx vercel --prod
```
Then add the production callback URL in Spotify Dashboard and set `VITE_SPOTIFY_CLIENT_ID` in Vercel environment variables.

## iPhone Commands
- "transfer to iPhone 17 Pro"
- "play on my phone"
- "list devices"

Built for modern website development & marketing teams.
