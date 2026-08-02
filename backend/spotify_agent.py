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
        log.error("Missing Spotify credentials. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
        return None

    try:
        auth_manager = SpotifyOAuth(
            client_id=SPOTIFY_CLIENT_ID,
            client_secret=SPOTIFY_CLIENT_SECRET,
            redirect_uri=SPOTIFY_REDIRECT_URI,
            scope=SPOTIFY_SCOPE,
            cache_path=CACHE_PATH,
            open_browser=True,
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


# ---------------------------------------------------------------------------
# Spotify helpers
# ---------------------------------------------------------------------------

def get_user_product(sp: spotipy.Spotify) -> Dict[str, Any]:
    user = sp.current_user()
    product = (user.get("product") or "free").lower()
    return {
        "is_premium": product == "premium",
        "product": product,
        "display_name": user.get("display_name") or "User",
        "id": user.get("id"),
        "email": user.get("email"),
    }


def find_playlist(sp: spotipy.Spotify, name: str) -> Optional[Dict[str, Any]]:
    name_lower = name.lower().strip()
    offset = 0
    while True:
        results = sp.current_user_playlists(limit=50, offset=offset)
        for pl in results.get("items", []):
            if pl["name"].lower().strip() == name_lower:
                return pl
        if not results.get("next"):
            break
        offset += 50
    return None


def list_playlists(sp: spotipy.Spotify, limit: int = 15) -> str:
    results = sp.current_user_playlists(limit=limit)
    lines = [f"📋 Playlists (top {limit}):", "-" * 55]
    for idx, pl in enumerate(results.get("items", []), 1):
        marker = " ★" if pl["name"].lower() == "sportify" else ""
        lines.append(f"{idx:2}. {pl['name']}{marker}  ({pl['tracks']['total']} tracks)")
    lines.append("-" * 55)
    return "\n".join(lines)


def list_devices(sp: spotipy.Spotify) -> str:
    data = sp.devices()
    devices = data.get("devices") or []
    if not devices:
        return "No active devices found. Open Spotify on a phone or computer."
    lines = ["Available devices:"]
    for d in devices:
        active = " ← active" if d.get("is_active") else ""
        lines.append(f"• {d['name']} ({d['type']}){active}")
    return "\n".join(lines)


def transfer_to_device(sp: spotipy.Spotify, device_name_hint: str, play: bool = True) -> str:
    data = sp.devices()
    devices = data.get("devices") or []
    if not devices:
        return "No devices available."

    hint = device_name_hint.lower()
    target = None

    # Priority matching
    for d in devices:
        name = d["name"].lower()
        if "iphone 17 pro" in name or ("iphone 17" in name and "pro" in hint):
            target = d
            break
    if not target:
        for d in devices:
            if hint in d["name"].lower() or (hint in ["phone", "iphone"] and d["type"] == "Smartphone"):
                target = d
                break
    if not target and ("this" in hint or "agent" in hint or "browser" in hint):
        # Prefer computer type for "this agent"
        for d in devices:
            if d["type"] == "Computer":
                target = d
                break

    if not target:
        return f"Could not find a device matching “{device_name_hint}”. Try “list devices” first."

    try:
        sp.transfer_playback(device_id=target["id"], force_play=play)
        return f"✅ Transferred playback to “{target['name']}”."
    except Exception as e:
        return f"Transfer failed: {e}. Premium is required for device transfer."


def show_profile(sp: spotipy.Spotify) -> str:
    info = get_user_product(sp)
    return (
        f"👤 Current User\n"
        f"   Name     : {info['display_name']}\n"
        f"   ID       : {info['id']}\n"
        f"   Email    : {info.get('email', 'N/A')}\n"
        f"   Plan     : {info['product'].upper()}"
    )


def play_top_tracks(sp: spotipy.Spotify, limit: int = 5) -> str:
    try:
        results = sp.current_user_top_tracks(limit=limit, time_range="medium_term")
        items = results.get("items") or []
        if not items:
            return "No top tracks found."
        uris = [t["uri"] for t in items]
        sp.start_playback(uris=uris)
        names = [f"{i+1}. {t['name']} – {t['artists'][0]['name']}" for i, t in enumerate(items)]
        return "▶️ Playing your top tracks:\n" + "\n".join(names)
    except Exception as e:
        return f"Could not start playback: {e}. Premium required."


def search_and_play(sp: spotipy.Spotify, query: str) -> str:
    try:
        results = sp.search(q=query, type="track", limit=1)
        tracks = results.get("tracks", {}).get("items") or []
        if not tracks:
            return f"No results for “{query}”."
        track = tracks[0]
        sp.start_playback(uris=[track["uri"]])
        return f"▶️ Playing “{track['name']}” by {track['artists'][0]['name']}"
    except Exception as e:
        return f"Found track but playback failed: {e}. Premium required."


# ---------------------------------------------------------------------------
# Intent execution
# ---------------------------------------------------------------------------

def execute_intent(intent: Dict[str, Any], sp: spotipy.Spotify) -> str:
    action = (intent.get("action") or "").lower().strip()

    if action == "list_playlists":
        limit = int(intent.get("limit", 10))
        return list_playlists(sp, limit=limit)

    if action in ("find_sportify", "sportify"):
        pl = find_playlist(sp, "Sportify")
        if pl:
            return (
                f"✅ Found: {pl['name']}\n"
                f"   ID   : {pl['id']}\n"
                f"   Tracks: {pl['tracks']['total']}\n"
                f"   URL  : {pl['external_urls']['spotify']}"
            )
        return "❌ 'Sportify' playlist not found."

    if action in ("profile", "me", "whoami"):
        return show_profile(sp)

    if action in ("list_devices", "devices"):
        return list_devices(sp)

    if action == "transfer":
        target = intent.get("target") or intent.get("device") or "iphone"
        play = intent.get("play", True)
        return transfer_to_device(sp, str(target), play=bool(play))

    if action == "play_top":
        return play_top_tracks(sp, limit=int(intent.get("limit", 5)))

    if action == "play":
        query = intent.get("query") or intent.get("track") or ""
        if not query:
            return "Tell me what to play."
        return search_and_play(sp, query)

    if action == "help":
        return """Available actions:
• list_playlists
• find_sportify
• profile
• list_devices
• transfer  (target: iphone / desktop / device name)
• play_top
• play      (query: song or artist)
• help"""

    return f"Unrecognized action: {action}. Type help for options."


# ---------------------------------------------------------------------------
# Natural language → intent (via Grok)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are the backend processing agent for Harmony AI Spotify integration.
Convert the user's natural language command into a single valid JSON object.
Reply ONLY with valid JSON. No markdown, no extra text.

Allowed actions:
1. {"action": "list_playlists", "limit": <1-50>}
2. {"action": "find_sportify"}
3. {"action": "profile"}
4. {"action": "list_devices"}
5. {"action": "transfer", "target": "<iphone|desktop|device name>", "play": true}
6. {"action": "play_top", "limit": <1-10>}
7. {"action": "play", "query": "<song or artist>"}
8. {"action": "help"}

Rules:
- Mentions of playlists → list_playlists or find_sportify
- Mentions of devices / transfer / play on phone → transfer or list_devices
- "play my top" / top tracks → play_top
- "play <something>" → play with query
- Profile / who am I → profile
- Anything unclear → help
"""


def process_with_grok(user_command: str, grok: OpenAI, sp: spotipy.Spotify) -> str:
    try:
        completion = grok.chat.completions.create(
            model=XAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_command}
            ],
            temperature=0.1,
            max_tokens=200
        )

        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").replace("json", "", 1).strip()

        intent = json.loads(raw)
        log.info(f"Grok intent → {intent}")
        return execute_intent(intent, sp)

    except json.JSONDecodeError:
        log.warning("Grok did not return valid JSON. Falling back.")
        return fallback_keyword(user_command, sp)
    except Exception as e:
        log.error(f"Grok error: {e}")
        return fallback_keyword(user_command, sp)


def fallback_keyword(command: str, sp: spotipy.Spotify) -> str:
    cmd = command.lower()
    if any(w in cmd for w in ["list playlist", "my playlist", "playlists"]):
        return list_playlists(sp)
    if "sportify" in cmd:
        return execute_intent({"action": "find_sportify"}, sp)
    if any(w in cmd for w in ["device", "devices"]):
        return list_devices(sp)
    if any(w in cmd for w in ["transfer", "play on", "switch to"]):
        target = "iphone" if "phone" in cmd or "iphone" in cmd else "desktop"
        return transfer_to_device(sp, target)
    if "top" in cmd and ("track" in cmd or "song" in cmd):
        return play_top_tracks(sp)
    if cmd.startswith("play "):
        return search_and_play(sp, cmd[5:].strip())
    if any(w in cmd for w in ["me", "profile", "whoami", "account"]):
        return show_profile(sp)
    return "Type 'help' or try: list devices, transfer to iPhone, play my top tracks, find Sportify."


# ---------------------------------------------------------------------------
# FastAPI remote control (optional)
# ---------------------------------------------------------------------------

def create_api(sp: spotipy.Spotify, grok: Optional[OpenAI]):
    try:
        from fastapi import FastAPI, HTTPException
        from pydantic import BaseModel
    except ImportError:
        log.warning("FastAPI not installed – remote API disabled. Run: pip install fastapi uvicorn")
        return None

    app = FastAPI(
        title="Harmony AI Spotify Agent",
        description="Grok-powered backend automation for OrgSuite",
        version="1.1.0"
    )

    class CommandRequest(BaseModel):
        command: str

    @app.get("/health")
    def health():
        info = get_user_product(sp)
        return {
            "status": "ok",
            "premium": info["is_premium"],
            "user": info["display_name"]
        }

    @app.post("/command")
    def run_command(req: CommandRequest):
        if not req.command.strip():
            raise HTTPException(400, "Empty command")
        if grok:
            result = process_with_grok(req.command, grok, sp)
        else:
            result = fallback_keyword(req.command, sp)
        return {"reply": result}

    @app.get("/devices")
    def devices():
        return {"reply": list_devices(sp)}

    @app.get("/profile")
    def profile():
        return {"reply": show_profile(sp)}

    return app


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 64)
    print("Harmony AI – Spotify Backend Agent  •  Grok Automation")
    print("Spotipy + xAI (Grok)  •  Org Suite / Sportify")
    print("=" * 64)

    sp = create_spotify_client()
    if not sp:
        sys.exit(1)

    grok = create_grok_client()

    # Quick Sportify check
    log.info("Checking for 'Sportify' playlist...")
    sportify = find_playlist(sp, "Sportify")
    if sportify:
        log.info(f"Sportify found (ID: {sportify['id']})")
    else:
        log.warning("Sportify playlist not found yet.")

    # Optional FastAPI mode
    if "--api" in sys.argv or os.getenv("HARMONY_API", "").lower() in ("1", "true", "yes"):
        app = create_api(sp, grok)
        if app:
            import uvicorn
            port = int(os.getenv("PORT", "8080"))
            log.info(f"Starting FastAPI server on port {port}")
            uvicorn.run(app, host="0.0.0.0", port=port)
            return
        else:
            log.error("Cannot start API mode – FastAPI missing.")
            sys.exit(1)

    # Interactive CLI mode
    print("\nReady. Type natural language commands (or 'quit' to exit).")
    print("Examples: “list my playlists”, “transfer to iPhone”, “play my top tracks”, “find Sportify”")
    print("Tip: run with --api to start the remote control server.\n")

    while True:
        try:
            user_input = input("Harmony> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("quit", "exit", "q"):
                print("Shutting down. Backend ready for CI/CD or Grok runners.")
                break

            if grok:
                reply = process_with_grok(user_input, grok, sp)
            else:
                reply = fallback_keyword(user_input, sp)

            print(reply)

        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye.")
            break


if __name__ == "__main__":
    main()
