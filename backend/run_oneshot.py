#!/usr/bin/env python3
"""One-shot Harmony command runner for GitHub Actions."""

from __future__ import annotations

import os
import sys

from spotify_agent import (
    create_grok_client,
    create_spotify_client,
    fallback_keyword,
    process_with_grok,
)


def main() -> int:
    command = os.getenv("HARMONY_COMMAND", "list devices").strip() or "list devices"
    print(f"HARMONY_COMMAND: {command}")

    sp = create_spotify_client()
    if not sp:
        print("Failed to connect to Spotify. Check repository secrets and token cache.")
        print("Guide: docs/GITHUB_ACTIONS_SECRETS.md")
        return 1

    grok = create_grok_client()
    print(f"Executing command: {command}")
    reply = process_with_grok(command, grok, sp) if grok else fallback_keyword(command, sp)

    print("\n=== AGENT REPLY ===")
    print(reply)
    print("===================")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
