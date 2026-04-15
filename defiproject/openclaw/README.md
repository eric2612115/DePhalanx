# OpenClaw (DeFi project)

This folder is the **agent workspace root** for OpenClaw: put skills, prompts, and project-specific files under `workspace/` (see [OpenClaw setup](https://docs.openclaw.ai/start/setup)).

## Do you need a separate “agent ↔ Telegram” token?

**No.** Telegram only needs the **Bot API token** from `@BotFather` (`TELEGRAM_BOT_TOKEN` / `channels.telegram.botToken`). That token is what authenticates your bot to Telegram; OpenClaw uses it inside the Gateway—there is no extra “bridge token” between the agent and Telegram for normal use.

Optional, **different** secrets you may see:

| Secret | Purpose |
|--------|--------|
| **`TELEGRAM_BOT_TOKEN`** | Required. Identifies your bot to Telegram. |
| **`OPENCLAW_GATEWAY_TOKEN`** (or `gateway.auth.token`) | Optional but recommended: protects **local** Gateway HTTP/WebSocket (Control UI, CLI)—**not** Telegram. |
| **Model API keys** (e.g. Anthropic/OpenAI) | Required for the LLM; configure in onboarding or `auth-profiles` / provider env vars. |
| **`hooks.token`** | Only if you enable HTTP **webhooks**; separate from Gateway token per [docs](https://docs.openclaw.ai/gateway/configuration#configure-webhooks-hooks). |

## One-time: install OpenClaw on this machine

See [Install](https://docs.openclaw.ai/install). You need Node **24** (recommended) or **22.14+**.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
# or: npm install -g openclaw@latest
```

## This workspace machine (setup done here)

- OpenClaw CLI is installed globally (`npm install -g openclaw@latest`).
- Gateway config lives at **`~/.openclaw/openclaw.json`** (not in git). Agent workspace path: **`/workspace/defiproject/openclaw/workspace`**.
- Secrets for the daemon: **`~/.openclaw/.env`** (chmod 600). **`OPENCLAW_GATEWAY_TOKEN`** is already generated for you—**do not commit this file.**

### What you must add in `~/.openclaw/.env`

| Variable | Required | Notes |
|----------|----------|--------|
| **`OPENAI_API_KEY`** | **Yes** (for default model `openai/gpt-5.4`) | Get from OpenAI. If you use another provider instead, run `openclaw onboard` / `openclaw configure --section model` and adjust—then the env var name may differ (e.g. `ANTHROPIC_API_KEY`). |
| **`TELEGRAM_BOT_TOKEN`** | **Yes** (for Telegram) | From `@BotFather`. |
| **`OPENCLAW_GATEWAY_TOKEN`** | Already set | Local Control UI / CLI auth; keep as-is unless you rotate. |

After editing `.env`, start the gateway (env is loaded automatically from `~/.openclaw/.env` when present):

```bash
openclaw gateway run
# or: openclaw gateway
```

First Telegram DM: **`openclaw pairing list telegram`** then **`openclaw pairing approve telegram <CODE>`** (default `dmPolicy` is `pairing`).

## Wire this project as the agent workspace

1. Copy env template and set paths/secrets:

   ```bash
   cd defiproject/openclaw
   cp .env.example .env
   ```

   Set **`DEFIPROJECT_OPENCLAW_WORKSPACE`** to the **absolute** path of `defiproject/openclaw/workspace` on this machine.

   Set **`TELEGRAM_BOT_TOKEN`** when you have it.

   Generate a long random **`OPENCLAW_GATEWAY_TOKEN`** (e.g. `openssl rand -hex 32`) for Gateway auth.

2. Merge **`openclaw.json.example`** into **`~/.openclaw/openclaw.json`** (or copy and edit). OpenClaw reads global config from `~/.openclaw/`; `agents.defaults.workspace` should point at this repo’s `workspace` directory.

3. Load env for the Gateway process. OpenClaw loads **`~/.openclaw/.env`** automatically. Either symlink or append the variables from this folder’s `.env` into `~/.openclaw/.env`, or export them before `openclaw gateway`.

4. First Telegram DM: start the gateway, then approve pairing (or switch to `dmPolicy: "allowlist"` and set `allowFrom` to your numeric user ID—see [Telegram channel](https://docs.openclaw.ai/channels/telegram)):

   ```bash
   openclaw gateway
   openclaw pairing list telegram
   openclaw pairing approve telegram <CODE>
   ```

5. Check health:

   ```bash
   openclaw doctor
   openclaw security audit
   ```

## Files

- `openclaw.json.example` — paste/merge into `~/.openclaw/openclaw.json`.
- `.env.example` — copy to `.env` here; mirror secrets into `~/.openclaw/.env` for the daemon.
- `workspace/` — OpenClaw agent workspace (gitignored contents except `.gitkeep`).
