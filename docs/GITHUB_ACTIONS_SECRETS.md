# GitHub Actions secrets — Harmony Grok Agent

The scheduled workflow `.github/workflows/harmony-grok-agent.yml` runs `list devices` every day at 08:00 UTC.

That job **cannot** read a local `.env` file from a phone or laptop. It only sees **repository secrets**.

Failed run example (2026-09-09, run 38):

- `HARMONY_COMMAND: list devices`
- `Missing Spotify credentials`
- `Process completed with exit code 1`

That is a **configuration** failure, not a code defect.

PR #2 is merged to `main`. The remaining owner step is adding repository secrets.

## Required secrets

Repo → **Settings → Secrets and variables → Actions**:

https://github.com/pointgoddesscc-sketch/harmony-ai-spotify-agent/settings/secrets/actions

| Secret | Required | Purpose |
|--------|----------|---------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify Developer app Client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify Developer app Client Secret (backend only) |
| `SPOTIFY_TOKEN_CACHE` **or** `SPOTIFY_REFRESH_TOKEN` | Yes for CI | Headless user login. GitHub runners cannot open a browser. |
| `SPOTIFY_REDIRECT_URI` | Optional | Defaults to `http://localhost:8080` |
| `XAI_API_KEY` | Optional | Enables Grok natural-language parsing. Without it the keyword fallback still runs. |
| `XAI_MODEL` | Optional | Defaults to `grok-3` |

Never put these values in the repository, chat, or workflow YAML.

## How to create the token cache (one-time, local)

On a trusted machine with the Spotify Developer app already created:

```bash
cd backend
cp .env.example .env
# fill SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET
python spotify_agent.py
```

Complete the browser login once. Spotipy writes `backend/.spotify_token_cache`.

Then store **either**:

1. The full contents of `.spotify_token_cache` as secret `SPOTIFY_TOKEN_CACHE`
2. Or only the `refresh_token` field as secret `SPOTIFY_REFRESH_TOKEN`

This repository gitignores `.env` and `.spotify_token_cache`.

## After secrets are set

1. Re-run **Harmony Grok Agent – Scheduled Automation** with command `list devices`
2. Daily 08:00 UTC runs will execute instead of skipping
3. Keep the Client Secret out of Vercel front-end env (`VITE_*` is PKCE-only)

## Security notes

- The workflow no longer uploads `backend/.env` as an artifact.
- Scheduled runs with missing secrets now **skip cleanly** instead of failing red every morning.
- Manual `workflow_dispatch` still fails loudly if secrets are absent so the setup gap is visible.
- The official production app is the Vercel project `harmony-ai-spotify-agent`. The extra project `harmony-ai-spotify-agent-rtkv` is a duplicate Git link with root `api/` and is not required for Harmony.
