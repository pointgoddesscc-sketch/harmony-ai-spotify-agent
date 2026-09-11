# Harmony → Make automations

Production flow:

1. User event in Harmony (Telegram linked, Spotify track, Connect Spotify).
2. Browser or server POSTs `/api/make-event`.
3. Vercel reads `MAKE_HARMONY_WEBHOOK_URL` and forwards JSON to Make.
4. Make scenario `OrgSuite-Grok-In` fans out to Linear, Telegram, Gmail, Sheets, Slack.

## Owner setup

1. Make.com → New scenario → Webhooks → Custom webhook → name `OrgSuite-Grok-In`.
2. Copy the hook URL into Vercel project `harmony-ai-spotify-agent` as `MAKE_HARMONY_WEBHOOK_URL`.
3. Redeploy. Do not commit the URL.
4. Confirm `GET https://harmony-ai-spotify-agent.vercel.app/api/make-event` returns `"status":"ready"`.

## Status contract

```json
{ "service": "make", "configured": true, "status": "ready" }
```

or

```json
{ "service": "make", "configured": false, "status": "missing_webhook" }
```

## Example payload

```json
{
  "source": "OrgSuite",
  "event": "spotify.track.played",
  "payload": { "user": "Org Suite", "track": "Song Name" }
}
```

Events Harmony already emits when the client is open:

- `telegram.linked`
- `spotify.connected`
- `spotify.track.played`

MCP tool names for a future Make MCP client (not live in this Grok chat until Make OAuth succeeds):

- `make.trigger`
- `make.status`
- `make.scenarios`
- `make.logs`
