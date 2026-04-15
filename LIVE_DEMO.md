# DePhalanx Live Demo Checklist

## Goal

Record one continuous OpenClaw-first demo where Telegram ingress and LLM stay in OpenClaw, `DePhalanx` owns orchestration, and `Phalanx-Skill` remains the only execution authority.

## Secret Placement

- OpenClaw:
  - Telegram bot token
  - LLM provider key
  - OpenClaw hook token / outbound webhook config
- DePhalanx:
  - `DEPHALANX_OPENCLAW_HOOK_TOKEN`
  - `DEPHALANX_OPENCLAW_WEBHOOK_SECRET`
  - OmRate base URL and product-side config
- Phalanx-Skill:
  - `config.env` execution secrets
  - OKX credentials
  - wallet / owner binding
  - runtime approval state

## Before Recording

1. Put both repos side by side:

```text
workspace/
  Phalanx-Skill/
  DePhalanx/
```

2. In `Phalanx-Skill`, fill `config.env` with the real execution-side setup.
3. In `DePhalanx`, copy `.env.example` to `.env` and verify:
   - `DEPHALANX_OPENCLAW_BASE_URL`
   - `DEPHALANX_OPENCLAW_HOOK_TOKEN`
   - `DEPHALANX_OPENCLAW_WEBHOOK_SECRET`
   - `DEPHALANX_PHALANX_SKILL_CWD=../Phalanx-Skill`
   - `DEPHALANX_PHALANX_SKILL_CONFIG_PATH=../Phalanx-Skill/config.env`
   - `DEPHALANX_OMRATE_PATH=/markets?limit=200`
4. Make sure OpenClaw already has:
   - Telegram connected
   - one LLM provider key configured
   - hooks enabled with a dedicated token
5. Start OpenClaw outbound `message.received` webhook to:
   - `http://127.0.0.1:4319/openclaw/events`
6. Start `DePhalanx`:

```bash
npm run dev
```

7. Verify the console prints `mode: "live_ingress"`.
8. In another terminal, run:

```bash
npm run smoke:live
```

9. Only continue to Telegram if the smoke run returns:
   - an approval prompt
   - then a final execution summary

## Recording Flow

1. Open Telegram and send `funds are ready`.
2. Show the OpenClaw-hosted message entering the system.
3. Wait for the approval prompt from `DePhalanx`.
4. Show the line containing `Approval ID: ...`.
5. Reply `approve <approvalId>`.
6. Wait for the final execution summary message.
7. Stop recording only after the final summary is visible.

There is no replay product path in `DePhalanx`. If this checklist does not pass, fix the live stack before recording.

