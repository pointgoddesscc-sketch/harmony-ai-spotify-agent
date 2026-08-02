# Harmony AI – Spotify Backend Agent (Grok Automation)

**Python + Spotipy + xAI (Grok) + optional FastAPI**

Production-ready headless agent for OrgSuite automation.

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Front-end | Vanilla JS + Vite + PKCE | Live Vercel dashboard & user sessions |
| Backend (this folder) | Python + Spotipy + xAI API | Headless automation & natural language control |

## Target Account
- Profile: **Org Suite**
- Key playlist: **Sportify**

## Features
- Secure headless Spotify authentication (token caching)
- Natural language commands processed by **Grok** via official xAI API
- Structured JSON intent system with robust fallbacks
- Premium detection and clear warnings
- Device list + smart transfer (iPhone priority)
- Play top tracks / search & play
- Optional **FastAPI remote control** (`--api` mode) for OrgSuite and other AIs
- Fully environment-variable driven (no secrets in code)

## Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

```env
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=http://localhost:8080

XAI_API_KEY=...          # from https://console.x.ai
XAI_MODEL=grok-3         # or preferred model
```

## Run – Interactive CLI

```bash
python spotify_agent.py
```

Examples:
```
list my playlists
find the Sportify playlist
list devices
transfer to iPhone
play my top tracks
play lo-fi beats
who am I?
```

## Run – Remote API Mode (recommended for automation)

```bash
python spotify_agent.py --api
# or
HARMONY_API=1 python spotify_agent.py
```

Endpoints:
- `GET  /health`     → status + premium check
- `POST /command`    → `{"command": "transfer to iPhone"}`
- `GET  /devices`
- `GET  /profile`

## Architecture Notes
- Front-end (Vercel) continues to use PKCE and never sees the Client Secret.
- This backend uses Client ID + Client Secret and is intended only for trusted server environments.
- Grok is called through the official `openai` Python package pointed at `https://api.x.ai/v1`.
- Premium is required for playback control and device transfer.

Ready for GitHub Actions, Codex, Grok runners, and OrgSuite remote control.
