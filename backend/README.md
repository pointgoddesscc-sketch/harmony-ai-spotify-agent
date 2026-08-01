# Harmony AI – Spotify Backend Agent

**Python + Spotipy + xAI (Grok)** headless automation agent.

This backend runs independently of the JavaScript + Vite front-end that is deployed on Vercel.

| Layer | Technology | Responsibility |
|-------|------------|----------------|
| Front-end | Vanilla JS + Vite + PKCE | Live Vercel dashboard & user sessions |
| Backend (this folder) | Python + Spotipy + xAI API | Headless automation & natural language control |

## Target Account
- Profile: **Org Suite**
- Username: `31f7pokhxg2zwvdtlimynslkb5wy`
- Key playlist: **Sportify**

## Features
- Secure headless Spotify authentication (token caching)
- Natural language commands processed by Grok via the official xAI API
- Structured JSON intent system
- Fallback keyword matching if Grok is unavailable
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
XAI_MODEL=grok-3         # or the model you prefer
```

## Run

```bash
python spotify_agent.py
```

On first run you will authorize the Org Suite Spotify account once.  
Afterwards the agent is fully headless and ready for Grok / CI runners.

## Example Commands
```
list my playlists
find the Sportify playlist
who am I?
help
```

## Architecture Notes
- The front-end (Vercel) continues to use PKCE and never sees the Client Secret.
- This backend uses Client ID + Client Secret and is intended only for trusted server environments.
- Grok is called through the official `openai` Python package pointed at `https://api.x.ai/v1`.

Ready for GitHub, GitLab, Codex, and Grok automation pipelines.
