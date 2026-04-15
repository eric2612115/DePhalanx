# openclaw-project

Standalone OpenClaw agent project (**not** part of DePhalanx). Put this entire folder here on your Mac:

**`/Users/cass/DefiProject/openclaw-project/`**

| Path | Role |
|------|------|
| **`/Users/cass/DefiProject/openclaw-project/`** | This project (README, examples) |
| **`/Users/cass/DefiProject/openclaw-project/workspace/`** | OpenClaw `agents.defaults.workspace` (skills, prompts) |
| **`~/.openclaw/openclaw.json`** | Gateway + channels (copy from `openclaw.json.example`) |
| **`~/.openclaw/.env`** | Secrets: `TELEGRAM_BOT_TOKEN`, API keys, `OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_PROJECT_WORKSPACE` |

## Telegram vs Gateway vs model keys

| Variable | Purpose |
|----------|---------|
| **`TELEGRAM_BOT_TOKEN`** | Bot API token from `@BotFather`. |
| **`OPENCLAW_GATEWAY_TOKEN`** | Local Gateway auth (not Telegram). |
| **`OPENAI_API_KEY`** / **`GEMINI_API_KEY`** / **`GOOGLE_API_KEY`** | Model provider (match `openclaw onboard` / `agents.defaults.model`). |

## Install OpenClaw

[Install](https://docs.openclaw.ai/install) — Node **24** or **22.14+**.

## Setup

1. Copy **`.env.example`** → **`.env`** and fill secrets. Ensure **`OPENCLAW_PROJECT_WORKSPACE`** points at **`…/openclaw-project/workspace`** (default uses `${HOME}/DefiProject/openclaw-project/workspace`).

2. Merge **`openclaw.json.example`** into **`~/.openclaw/openclaw.json`**.

3. Copy the same variables into **`~/.openclaw/.env`** (or symlink).

4. Run:

   ```bash
   openclaw doctor
   openclaw gateway run
   ```

5. Telegram pairing:

   ```bash
   openclaw pairing list telegram
   openclaw pairing approve telegram <CODE>
   ```

See [Telegram channel](https://docs.openclaw.ai/channels/telegram) for `allowlist` / `allowFrom`.
