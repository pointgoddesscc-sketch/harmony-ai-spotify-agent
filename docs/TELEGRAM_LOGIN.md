# Telegram login on Harmony

Harmony uses the official Telegram Login Widget and the existing OrgSuite bot.
It does **not** collect a Telegram password.

## Live UI

https://harmony-ai-spotify-agent.vercel.app

Dashboard card: **Telegram Login**

## Official surfaces

| Path | URL |
|------|-----|
| Bot | https://t.me/Orgsute_telegram_bot?start=harmony |
| Bot runtime | https://orgsuite-telegram-bot.vercel.app |
| User-account MCP | https://pse-sent-telegram-mcp.vercel.app |

## Owner setup so the widget appears

1. Open https://t.me/BotFather
2. Select `@Orgsute_telegram_bot`
3. Bot Settings → Domain → set:
   `harmony-ai-spotify-agent.vercel.app`
4. Optional Vercel env on **harmony-ai-spotify-agent**:
   - `VITE_TELEGRAM_BOT_USERNAME=Orgsute_telegram_bot`
   - `TELEGRAM_BOT_TOKEN` (same bot token, server verify only — never commit)
5. Redeploy Harmony after adding `VITE_` vars.

## After the user taps login

1. Telegram approves the widget or opens the bot.
2. Harmony stores the public widget profile in this browser only.
3. Harmony opens `@Orgsute_telegram_bot?start=harmony` so the bot continues.
4. User taps **Connect Spotify** on the same Harmony page.

## Not done here

- MTProto phone/QR user login still requires secrets on `pse-sent-telegram-mcp` (`ready: false` as of the last health check).
- Bot `/start harmony` replies require `TELEGRAM_BOT_TOKEN` on the **orgsuite-telegram-bot** Vercel project.
