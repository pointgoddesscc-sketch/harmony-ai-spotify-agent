# Harmony AI – Spotify Music Agent

**OrgSuite Edition** · Vanilla JS + Vite + PKCE + Web Playback SDK + Spotify Connect

Live: https://harmony-ai-spotify-agent.vercel.app  
Repo: https://github.com/pointgoddesscc-sketch/harmony-ai-spotify-agent

---

## Why you see “Client ID not configured”

The app is working correctly. Spotify login **requires** a Developer **Client ID**.

These are **NOT** Client IDs:

| Value | What it actually is |
|--------|---------------------|
| `31f7pokhxg2zwvdtlimynslkb5wy` | Your Spotify **user ID** |
| Profile / playlist links | User or playlist links |
| `BQB...` tokens | Temporary **access tokens** |
| `account_id` in API docs | User field after login |

You only get a Client ID after creating an app on the Spotify Developer Dashboard.

---

## Setup (required)

### 1. Create a Spotify Developer app

1. Open https://developer.spotify.com/dashboard  
2. Log in with the same Spotify account you use in the app  
3. If you see **“You haven’t created any apps yet”**, click **Create app**  
4. Accept the **Developer Terms of Service**  
5. App name example: `Harmony AI`  
6. After creation, open the app and copy **Client ID**

**2026 rule:** Development Mode requires the app **owner** to have **Spotify Premium**.  
If the account is Free, the app may be limited or stop working.  
See: https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security

If **Create app** is missing or disabled, Spotify may be restricting new integrations temporarily — try desktop browser, accept any policy banners, or retry later.

### 2. Add Redirect URI

In the app → **Settings** / **Edit Settings** → Redirect URIs → add **exactly**:

```
https://harmony-ai-spotify-agent.vercel.app/callback
```

Optional for local dev:

```
http://127.0.0.1:5173/callback
```

Save.

### 3. Set Client ID on Vercel

1. https://vercel.com → project **harmony-ai-spotify-agent**  
2. **Settings → Environment Variables**  
3. Add:

```
VITE_SPOTIFY_CLIENT_ID = <paste Client ID from step 1>
```

4. Environment: **Production** (and Preview if you want)  
5. **Redeploy** the latest production deployment  

### 4. Connect

1. Open https://harmony-ai-spotify-agent.vercel.app  
2. Red banner should be gone  
3. Click **Connect Spotify** → approve access  

---

## Features

- Authorization Code + **PKCE** (no client secret in the browser)
- Web Playback SDK (Premium)
- Spotify Connect device list + transfer
- Natural language agent (“list devices”, “transfer to iPhone”, top tracks…)
- Real-time polling for Now Playing
- Vercel Edge chat (`/api/chat`)
- Connector status UI
- Clear errors when Client ID is missing
- Vitest integration tests

### Free vs Premium

| Feature | Free | Premium |
|---------|------|---------|
| Login, search, library | Yes | Yes |
| List devices | Yes | Yes |
| Transfer / remote play | No | Yes |
| Web Playback SDK | No | Yes |
| Development Mode API (2026) | Limited | Required for owner |

---

## Local development

```bash
cp .env.example .env
# set VITE_SPOTIFY_CLIENT_ID in .env
npm install
npm run dev
```

Tests:

```bash
npm test
```

---

## Project structure

```
api/chat.js          Edge chat (cached + optional Grok)
src/auth.js          PKCE login + missing Client ID checks
src/spotify-api.js   Web API helpers
src/player.js        Web Playback SDK
src/agent.js         Natural language commands
src/polling.js       Real-time Now Playing / devices
src/connectors.js    Connector status panel
tests/               Vitest integration tests
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Red “Client ID not configured” | Create Developer app → set `VITE_SPOTIFY_CLIENT_ID` on Vercel → redeploy |
| Empty Developer Dashboard | Create first app; accept Terms checkbox |
| Create app disabled | Policy banner / temporary hold; try desktop; Premium may be required |
| Login redirect error | Redirect URI must match exactly (see above) |
| Transfer / SDK fails | Spotify Premium required |

---

## What maintainers cannot do for you

- Create a Spotify Developer app on your account  
- Accept Developer Terms for you  
- Read or set your Vercel secret env vars without the real Client ID  
- Upgrade your Spotify account to Premium  

Those steps must be done in your Spotify + Vercel accounts.

Built for OrgSuite · modern web & marketing teams.
