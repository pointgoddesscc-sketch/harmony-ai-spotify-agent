#!/usr/bin/env python3
"""
Harmony AI – Spotify Backend Agent (Grok Automation)
====================================================
Production-ready headless agent that combines:

• Spotipy  → authenticates the Org Suite Spotify account
• xAI API  → uses Grok as the natural-language reasoning engine
• Optional FastAPI server → remote control from OrgSuite / other AIs

This agent runs independently of the JavaScript + Vite front-end
that is deployed on Vercel. Clear separation of concerns:

  Front-end (Vercel)  → live user sessions via PKCE
  Backend (this file) → server-side / Grok automation

Target account:
  Profile  : Org Suite
  Key playlist : Sportify

Premium is required for playback control and device transfer.
"""

from __future__ import annotations

import os
import sys
import json
import logging
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from openai import OpenAI

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("harmony")

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv()

SPOTIFY_CLIENT_ID     = os.getenv("SPOTIFY_CLIENT_ID")
SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
SPOTIFY_REDIRECT_URI  = os.getenv("SPOTIFY_REDIRECT_URI", "http://localhost:8080")
SPOTIFY_SCOPE         = os.getenv(
    "SPOTIFY_SCOPE",
    "user-library-read playlist-read-private playlist-modify-public "
    "playlist-modify-private user-read-private user-read-email "
    "user-top-read user-read-recently-played user-read-playback-state "
    "user-modify-playback-state"
)

XAI_API_KEY = os.getenv("XAI_API_KEY")
XAI_MODEL   = os.getenv("XAI_MODEL", "grok-3")

CACHE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".spotify_token_cache")
SPOTIFY_REFRESH_TOKEN = os.getenv("SPOTIFY_REFRESH_TOKEN")
SPOTIFY_TOKEN_CACHE = os.getenv("SPOTIFY_TOKEN_CACHE")


def _is_headless() -> bool:
    return os.getenv("CI", "").lower() == "true" or os.getenv("HARMONY_HEADLESS", "").lower() in (
        "1",
        "true",
        "yes",
    )


def _restore_token_cache() -> None:
    """Restore a pre-authorized cache for headless / GitHub Actions runs."""
    raw = (SPOTIFY_TOKEN_CACHE or "").strip()
    if raw:
        with open(CACHE_PATH, "w", encoding="utf-8") as handle:
            handle.write(raw if raw.endswith("\n") else raw + "\n")
        log.info("Restored Spotify token cache from SPOTIFY_TOKEN_CACHE.")
        return
    refresh = (SPOTIFY_REFRESH_TOKEN or "").strip()
    if refresh:
        payload = {
            "refresh_token": refresh,
            "token_type": "Bearer",
            "scope": SPOTIFY_SCOPE,
            "expires_in": 0,
            "expires_at": 0,
        }
        with open(CACHE_PATH, "w", encoding="utf-8") as handle:
            json.dump(payload, handle)
        log.info("Wrote minimal Spotify cache from SPOTIFY_REFRESH_TOKEN.")


# ---------------------------------------------------------------------------
# xAI (Grok) client
# ---------------------------------------------------------------------------

def create_grok_client() -> Optional[OpenAI]:
    if not XAI_API_KEY:
        log.warning("XAI_API_KEY not set – natural language understanding disabled.")
        return None

    client = OpenAI(
        api_key=XAI_API_KEY,
        base_url="https://api.x.ai/v1"
    )
    log.info(f"xAI client ready (model: {XAI_MODEL})")
    return client


# ---------------------------------------------------------------------------
# Spotify client
# ---------------------------------------------------------------------------

def create_spotify_client() -> Optional[spotipy.Spotify]:
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        if _is_headless() or os.getenv("GITHUB_ACTIONS"):
            log.error(
                "Missing Spotify credentials. Set GitHub Actions repository secrets "
                "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET. "
                "See docs/GITHUB_ACTIONS_SECRETS.md"
            )
        else:
            log.error("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
        return None

    _restore_token_cache()
    headless = _is_headless()
    if headless and not os.path.exists(CACHE_PATH) and not (SPOTIFY_REFRESH_TOKEN or "").strip():
        log.error(
            "Headless mode needs a cached user token. Set SPOTIFY_TOKEN_CACHE or "
            "SPOTIFY_REFRESH_TOKEN. Interactive browser login is disabled in CI."
        )
        return None

    try:
        auth_manager = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope=SPOTIFY_SCOPE,
            cache_path=CACHE_PATH,
            open_browser=not headless,
            show_dialog=False
        )
        sp = spotipy.Spotify(auth_manager=auth_manager)

        user = sp.current_user()
        product = (user.get("product") or "free").lower()
        is_premium = product == "premium"

        log.info("Spotify connected")
        log.info(f"  Display Name : {user.get('display_name')}")
        log.info(f"  User ID      : {user.get('id')}")
        log.info(f"  Plan         : {product.upper()} {'✅' if is_premium else '⚠️  (Premium required for full control)'}")

        if not is_premium:
            log.warning("Account is on Free plan. Playback control and device transfer will fail until upgraded.")

        return sp

    except Exception as e:
        log.error(f"Spotify authentication failed: {e}")
        return None
