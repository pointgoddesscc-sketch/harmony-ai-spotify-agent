#!/usr/bin/env python3
"""
Harmony AI – Spotify Backend Agent
==================================
Production-ready headless agent that combines:

• Spotipy  → authenticates the Org Suite Spotify account
• xAI API  → uses Grok as the natural-language reasoning engine

This agent runs independently of the JavaScript + Vite front-end
that is deployed on Vercel. Clear separation of concerns:

  Front-end (Vercel)  → live user sessions via PKCE
  Backend (this file) → server-side / Grok automation

Target account:
  Profile  : Org Suite
  Username : 31f7pokhxg2zwvdtlimynslkb5wy
  Playlist : Sportify
"""

import os
import sys
import json
from typing import Optional, Dict, Any, List

from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from openai import OpenAI

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
        print("⚠️  XAI_API_KEY not set – natural language understanding disabled.")
        return None

    client = OpenAI(
        api_key=XAI_API_KEY,
        base_url="https://api.x.ai/v1"
    )
    print(f"✅ xAI client ready (model: {XAI_MODEL})")
    return client


# ---------------------------------------------------------------------------
# Spotify client
# ---------------------------------------------------------------------------

def create_spotify_client() -> Optional[spotipy.Spotify]:
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        print("❌ Missing Spotify credentials.")
        print("   Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env")
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
        print("✅ Spotify connected")
        print(f"   Display Name : {user.get('display_name')}")
        print(f"   User ID      : {user.get('id')}")
        print(f"   Plan         : {user.get('product', 'free').upper()}")
        return sp

    except Exception as e:
        print(f"❌ Spotify authentication failed: {e}")
        return None


# ---------------------------------------------------------------------------
# Spotify helpers
# ---------------------------------------------------------------------------

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


def list_playlists(sp: spotipy.Spotify, limit: int = 15) -> None:
    results = sp.current_user_playlists(limit=limit)
    print(f"\n📋 Playlists (top {limit}):")
    print("-" * 55)
    for idx, pl in enumerate(results.get("items", []), 1):
        marker = " ★" if pl["name"].lower() == "sportify" else ""
        print(f"{idx:2}. {pl['name']}{marker}  ({pl['tracks']['total']} tracks)")
    print("-" * 55)


def show_profile(sp: spotipy.Spotify) -> None:
    user = sp.current_user()
    print("\n👤 Current User")
    print(f"   Name     : {user.get('display_name')}")
    print(f"   ID       : {user.get('id')}")
    print(f"   Email    : {user.get('email', 'N/A')}")
    print(f"   Country  : {user.get('country', 'N/A')}")
    print(f"   Plan     : {user.get('product', 'free').upper()}")
    print(f"   Followers: {user.get('followers', {}).get('total', 0)}")


# ---------------------------------------------------------------------------
# Intent execution
# ---------------------------------------------------------------------------

def execute_intent(intent: Dict[str, Any], sp: spotipy.Spotify) -> None:
    action = intent.get("action", "").lower()

    if action == "list_playlists":
        limit = intent.get("limit", 10)
        list_playlists(sp, limit=limit)

    elif action in ("find_sportify", "sportify"):
        print("\n🔍 Searching for 'Sportify' playlist...")
        pl = find_playlist(sp, "Sportify")
        if pl:
            print(f"✅ Found: {pl['name']}")
            print(f"   ID   : {pl['id']}")
            print(f"   Tracks: {pl['tracks']['total']}")
            print(f"   URL  : {pl['external_urls']['spotify']}")
        else:
            print("❌ 'Sportify' playlist not found.")

    elif action in ("profile", "me", "whoami"):
        show_profile(sp)

    elif action == "help":
        print("""
Available intents Grok can return:
  • list_playlists   – show playlists
  • find_sportify    – locate the Sportify playlist
  • profile          – show current user info
  • help             – this message
""")

    else:
        print(f"⚠️  Unrecognized action from Grok: {action}")
        print("   Falling back to simple keyword matching...")
        if "list" in action or "playlist" in action:
            list_playlists(sp)
        elif "sportify" in action:
            execute_intent({"action": "find_sportify"}, sp)
        elif "me" in action or "profile" in action:
            show_profile(sp)


# ---------------------------------------------------------------------------
# Natural language → intent (via Grok)
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are the backend processing agent for Harmony AI Spotify integration.
Your only job is to convert the user's natural language command into a single valid JSON object.

Allowed actions (respond with exactly one of these):
1. {"action": "list_playlists", "limit": <integer between 1 and 50>}
2. {"action": "find_sportify"}
3. {"action": "profile"}
4. {"action": "help"}

Rules:
- Reply ONLY with a valid JSON object. No extra text, no markdown.
- If the user asks about playlists in general → list_playlists
- If the user mentions Sportify / sportify playlist → find_sportify
- If the user asks who they are / profile / me → profile
- For anything else → {"action": "help"}
"""

def process_with_grok(user_command: str, grok: OpenAI, sp: spotipy.Spotify) -> None:
    try:
        completion = grok.chat.completions.create(
            model=XAI_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_command}
            ],
            temperature=0.1,
            max_tokens=150
        )

        raw = completion.choices[0].message.content.strip()
        if raw.startswith("```"):
            raw = raw.strip("`").replace("json", "", 1).strip()

        intent = json.loads(raw)
        print(f"🧠 Grok intent → {intent}")
        execute_intent(intent, sp)

    except json.JSONDecodeError:
        print("❌ Grok did not return valid JSON. Falling back to keyword matching.")
        fallback_keyword(user_command, sp)
    except Exception as e:
        print(f"❌ Grok / system error: {e}")
        fallback_keyword(user_command, sp)


def fallback_keyword(command: str, sp: spotipy.Spotify) -> None:
    cmd = command.lower()
    if any(w in cmd for w in ["list", "playlist", "playlists"]):
        list_playlists(sp)
    elif "sportify" in cmd:
        execute_intent({"action": "find_sportify"}, sp)
    elif any(w in cmd for w in ["me", "profile", "whoami", "account"]):
        show_profile(sp)
    else:
        print("Type 'help' or ask something like “list my playlists” or “find Sportify”.")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 62)
    print("Harmony AI – Spotify Backend Agent")
    print("Spotipy + xAI (Grok)  •  Org Suite / Sportify")
    print("=" * 62)

    sp = create_spotify_client()
    if not sp:
        sys.exit(1)

    grok = create_grok_client()

    print("\n🔍 Checking for 'Sportify' playlist...")
    sportify = find_playlist(sp, "Sportify")
    if sportify:
        print(f"✅ Sportify found (ID: {sportify['id']})")
    else:
        print("⚠️  Sportify playlist not found yet.")

    print("\nReady. Type natural language commands (or 'quit' to exit).")
    print("Examples: “list my playlists”, “find the Sportify playlist”, “who am I?”")

    while True:
        try:
            user_input = input("\nHarmony> ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("quit", "exit", "q", "deploy"):
                print("Shutting down. Backend ready for CI/CD or Grok runner.")
                break

            if grok:
                process_with_grok(user_input, grok, sp)
            else:
                fallback_keyword(user_input, sp)

        except (KeyboardInterrupt, EOFError):
            print("\nGoodbye.")
            break


if __name__ == "__main__":
    main()
