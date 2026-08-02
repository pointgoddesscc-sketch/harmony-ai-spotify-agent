# Vercel Environment Variables – Harmony AI

These variables must be set **before** the production build so Spotify login works.

Live app: https://harmony-ai-spotify-agent.vercel.app

---

## Required

| Name | Required | Description |
|------|----------|-------------|
| `VITE_SPOTIFY_CLIENT_ID` | **Yes** | Spotify Developer **Client ID** (not username, not playlist ID, not access token) |

### Optional

| Name | Required | Description |
|------|----------|-------------|
| `VITE_REDIRECT_URI` | No | Defaults to `https://<your-domain>/callback` |
| `XAI_API_KEY` | No | Enables Grok-powered replies on `/api/chat` |
| `HARMONY_SYSTEM_PROMPT` | No | Custom system prompt for Grok chat |
| `CHAT_CACHE_TTL` | No | Edge chat cache TTL in seconds (default `60`) |

---

## Step-by-step (Vercel Dashboard)

1. Open [https://vercel.com](https://vercel.com) and sign in.
2. Open the project **harmony-ai-spotify-agent**  
   (prefer this project over `harmony-ai-spotify-agent-rtkv`).
3. Go to **Settings → Environment Variables**.
4. Click **Add New**.
5. Fill in:

   ```
   Key:   VITE_SPOTIFY_CLIENT_ID
   Value: <paste Client ID from Spotify Developer Dashboard>
   ```

6. Select environments:
   - **Production** (required)
   - **Preview** (recommended)
   - **Development** (optional)
7. Save.
8. Go to **Deployments** → open the latest deployment → **Redeploy**.  
   Or push a new commit so a fresh build runs.

> `VITE_` variables are embedded at **build time**.  
> Changing them without a redeploy will not update the live app.

---

## Where to get the Client ID

1. [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard)
2. **Create app** (if you see “You haven’t created any apps yet”).
3. Accept **Developer Terms**.
4. Open the app → copy **Client ID**.

Also add this **Redirect URI** in the Spotify app settings:

```
https://harmony-ai-spotify-agent.vercel.app/callback
```

---

## Local development (`.env`)

```bash
cp .env.example .env
```

```env
VITE_SPOTIFY_CLIENT_ID=your_client_id_here
# VITE_REDIRECT_URI=http://127.0.0.1:5173/callback
```

Then:

```bash
npm install
npm run dev
```

---

## Verify it worked

1. Open https://harmony-ai-spotify-agent.vercel.app
2. The red banner **“Spotify Client ID not configured”** should be gone.
3. Click **Connect Spotify** → Spotify login should open.

If the banner remains:
- Confirm the variable name is exactly `VITE_SPOTIFY_CLIENT_ID`
- Confirm it is enabled for **Production**
- Confirm you **redeployed after** saving the variable
- Confirm the value is the Developer **Client ID**, not your username

---

## Build commands (must not be `npm1`)

In **Settings → Build & Development Settings**:

| Setting | Value |
|---------|--------|
| Framework | Vite |
| Install Command | `npm install` (or empty to use `vercel.json`) |
| Build Command | `npm run build` (or empty) |
| Output Directory | `dist` |

A command of `npm1` causes: `Command "npm1" exited with 127`.

---

## 2026 note

Spotify Development Mode requires the app **owner** to have **Spotify Premium** for full API access.  
See: https://developer.spotify.com/blog/2026-02-06-update-on-developer-access-and-platform-security
