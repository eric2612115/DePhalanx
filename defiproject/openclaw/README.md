# OpenClaw (DeFi project)

Put this tree under **`~/DefiProject/`** on your machine (example: clone the repo so you have `~/DefiProject/defiproject/openclaw/`).

This folder is the **agent workspace parent**: skills and prompts go in **`workspace/`** (see [OpenClaw setup](https://docs.openclaw.ai/start/setup)).

## Layout on your computer

| Path | What it is |
|------|------------|
| **`~/DefiProject/defiproject/openclaw/`** | This project (this README) |
| **`~/DefiProject/defiproject/openclaw/workspace/`** | OpenClaw agent workspace (`agents.defaults.workspace`) |
| **`~/.openclaw/openclaw.json`** | Gateway + channels config (not in git) |
| **`~/.openclaw/.env`** | Secrets the Gateway reads (`TELEGRAM_BOT_TOKEN`, API keys, `OPENCLAW_GATEWAY_TOKEN`, etc.) |

If you **only** copy the inner `openclaw` folder to **`~/DefiProject/openclaw/`**, then set `DEFIPROJECT_OPENCLAW_WORKSPACE` to **`${HOME}/DefiProject/openclaw/workspace`** instead of the path below.

## Do you need a separate “agent ↔ Telegram” token?

**No.** Telegram only needs the **Bot API token** from `@BotFather` (`TELEGRAM_BOT_TOKEN` / `channels.telegram.botToken`). OpenClaw uses it inside the Gateway; there is no extra bridge token for normal use.

| Secret | Purpose |
|--------|--------|
| **`TELEGRAM_BOT_TOKEN`** | Bot identity toward Telegram. |
| **`OPENCLAW_GATEWAY_TOKEN`** | Local Gateway HTTP/WebSocket auth—not Telegram. |
| **`OPENAI_API_KEY` / `GEMINI_API_KEY` / …** | Model provider; match what you set in onboard/configure. |

## Install OpenClaw (once)

See [Install](https://docs.openclaw.ai/install). Node **24** (recommended) or **22.14+**.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
# or: npm install -g openclaw@latest
```

## Fill secrets

1. Copy **`.env.example`** → **`.env`** in this folder (optional local copy; gitignored).

2. Set at least:
   - **`TELEGRAM_BOT_TOKEN`**
   - **`OPENAI_API_KEY`** (or switch model + use **`GEMINI_API_KEY`** / **`GOOGLE_API_KEY`** for Gemini—run `openclaw onboard --auth-choice gemini-api-key` and set `agents.defaults.model.primary` to a `google/...` id)

3. Set **`DEFIPROJECT_OPENCLAW_WORKSPACE`** to the **absolute** workspace path, e.g.  
   **`${HOME}/DefiProject/defiproject/openclaw/workspace`**

4. Merge **`openclaw.json.example`** into **`~/.openclaw/openclaw.json`** so `agents.defaults.workspace` matches the same path (or use env substitution as in the example).

5. Copy the same variables into **`~/.openclaw/.env`** so the Gateway daemon sees them, or symlink that file to this `.env`.

## Run

```bash
openclaw doctor
openclaw gateway run
```

First Telegram DM (default **`pairing`**):

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Tighten to “only my user id” with **`dmPolicy: allowlist`** and **`allowFrom`**—see [Telegram channel](https://docs.openclaw.ai/channels/telegram).

## Files in this folder

- **`openclaw.json.example`** — merge into `~/.openclaw/openclaw.json`.
- **`.env.example`** — template; real secrets only in `.env` / `~/.openclaw/.env`, never commit.
- **`workspace/`** — agent workspace (contents gitignored except `.gitkeep`).
