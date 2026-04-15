# DePhalanx

`DePhalanx` is the mandate-aware product layer of AgentPhalanx. It connects an external brain host such as OpenClaw to `Phalanx-Skill`, owns `PhalanxLayer`, shapes portfolio decisions, and drives a strict live path where Telegram + LLM stay in OpenClaw while execution authority stays in `Phalanx-Skill`.

## Project Overview

This repo is the autonomous portfolio operator rather than the execution kernel.

- It accepts operator intent from a brain host.
- It stores structured mandate state as the source of truth for user preference.
- It uses product-side OmRate research to normalize opportunities.
- It compiles bounded action bundles and sends them to `Phalanx-Skill`.
- It renders approval prompts and final summaries for Telegram-facing demo flows.

## Architecture Overview

The current dependency chain is:

`OpenClaw -> DePhalanx -> Phalanx-Skill -> Onchain OS`

`DePhalanx` owns:

- `BrainAdapter` and the default `OpenClawAdapter`
- `PhalanxLayer`
- mandate store and operator-facing context
- Telegram approval/result rendering
- live OpenClaw webhook ingress and hook-based outbound delivery

`DePhalanx` does not own:

- raw signing
- unrestricted contract execution
- direct `Onchain OS` bypasses

## Deployment Address

Current P0 demo deployment model:

- `OpenClaw`: Telegram + LLM host
- `DePhalanx`: local Node.js ingress/orchestration service
- `Phalanx-Skill`: local MCP stdio sidecar spawned by `DePhalanx`
- OmRate intelligence endpoint: [https://api.omrate.com](https://api.omrate.com)

The live ingress entry is:

```bash
npm install
npm run dev
```

`DePhalanx` automatically reads `.env` on startup. By default it starts on:

- `GET /healthz`
- `POST /openclaw/events`

under `http://127.0.0.1:4319`.

The local synthetic verification path is:

```bash
npm run smoke:live
```

This is not a product demo path. It is a strict integration check that posts synthetic OpenClaw-shaped webhook events into the live ingress and expects the real runtime to respond.

## Onchain OS Skill / Uniswap Skill Usage

- `DePhalanx` does not call `Onchain OS` directly.
- `DePhalanx` uses `Phalanx-Skill` as the only bounded execution bridge.
- `Phalanx-Skill` is responsible for execution-side integration with `Onchain OS`, policy checks, whitelist checks, approvals, and evidence capture.
- The representative P0 path includes a `Uniswap` leg that intentionally degrades into `pending_approval`, so the approval UX is owned by `DePhalanx` while execution authority remains in `Phalanx-Skill`.

## Operating Mechanism

The current live flow is:

1. OpenClaw receives a Telegram message and forwards the event to `DePhalanx`.
2. `DePhalanx` normalizes the host payload through `BrainAdapter`.
3. `DePhalanx` fetches opportunities from OmRate through the configured live path.
4. `PhalanxLayer` filters opportunities against mandate and risk preference.
5. `DePhalanx` compiles a bounded action bundle of real Skill actions.
6. `DePhalanx` sends the bundle into the `Phalanx-Skill` MCP sidecar.
7. `Phalanx-Skill` either executes or returns `pending_approval`.
8. `DePhalanx` renders the approval prompt from the returned live contract data.
9. OpenClaw forwards the operator's approval reply back to `DePhalanx`.
10. `DePhalanx` resumes the exact pending action through `phalanx_approval_decision`.
11. `DePhalanx` sends the final summary back through the OpenClaw hook path.

There is no product replay path in the runtime. If OmRate, OpenClaw delivery, or Skill execution fails, the live stack fails explicitly.

## Live Demo Setup

Recommended new-machine layout:

```text
workspace/
  Phalanx-Skill/
  DePhalanx/
```

1. Clone both repos side by side.
2. In `Phalanx-Skill`, fill `config.env` with the real execution-side setup.
3. In `DePhalanx`, copy `.env.example` to `.env`.
4. In `DePhalanx/.env`, set at least:
   - `DEPHALANX_OPENCLAW_BASE_URL`
   - `DEPHALANX_OPENCLAW_HOOK_TOKEN`
   - `DEPHALANX_OPENCLAW_WEBHOOK_SECRET`
   - `DEPHALANX_PHALANX_SKILL_CWD=../Phalanx-Skill`
   - `DEPHALANX_PHALANX_SKILL_CONFIG_PATH=../Phalanx-Skill/config.env`
   - `DEPHALANX_OMRATE_PATH=/markets?limit=200`
5. Run `npm install` in both repos.
6. Start `DePhalanx` with `npm run dev`.
7. In another terminal, verify the local live path with `npm run smoke:live`.
8. Only after smoke passes, wire OpenClaw outbound `message.received` delivery to `http://127.0.0.1:4319/openclaw/events`.
9. In Telegram, send the real operator message.
10. When the approval prompt arrives, reply `approve <approvalId>`.
11. Record the final summary returned through OpenClaw.

## What You Must Prepare

- OpenClaw:
  - running gateway
  - Telegram bot/channel binding
  - LLM provider API key
  - hooks enabled with a dedicated hook token
  - outbound webhook support for `message.received`
- DePhalanx:
  - `.env` copied from `.env.example`
  - OpenClaw base URL
  - OpenClaw hook token
  - OpenClaw webhook secret
- Phalanx-Skill:
  - `config.env`
  - execution-side wallet / OKX / owner config

## OpenClaw Minimum Hook Setup

According to current OpenClaw webhook docs, the minimum gateway hook setup is:

```bash
openclaw config set hooks.enabled true
openclaw config set hooks.token "$(openssl rand -hex 32)"
openclaw config set hooks.path "/hooks"
```

Then restart the OpenClaw gateway and copy that token into `DEPHALANX_OPENCLAW_HOOK_TOKEN`.

For `OpenClaw -> DePhalanx`, configure an outbound webhook for `message.received` pointing to:

```text
http://127.0.0.1:4319/openclaw/events
```

Use `DEPHALANX_OPENCLAW_WEBHOOK_SECRET` as the HMAC signing secret if your OpenClaw outbound webhook supports request signing.

## New Machine Quick Start

```bash
git clone git@github.com-eric26:eric2612115/Phalanx-Skill.git
git clone git@github.com-eric26:eric2612115/DePhalanx.git

cd Phalanx-Skill
npm install

cd ../DePhalanx
npm install
cp .env.example .env
npm run dev
```

Once `DePhalanx` is running, configure OpenClaw and then run:

```bash
npm run smoke:live
```

## Secret Boundary

- OpenClaw keeps Telegram and LLM host secrets.
- `DePhalanx` keeps only OpenClaw hook auth and product-side config.
- `Phalanx-Skill` keeps execution-side secrets, wallet bindings, and approval truth.

## Recording Checklist

Use [`LIVE_DEMO.md`](LIVE_DEMO.md) for the exact single-take checklist.

## X Layer Positioning

`DePhalanx` positions AgentPhalanx as an operator layer for cross-chain DeFi automation in the X Layer ecosystem. In the current P0 story it treats `Base` as the larger stable allocation venue and keeps an `X Layer` leg in the proposal so the product can demonstrate cross-chain mandate-aware allocation instead of a single-chain script.

## Team

- Eric
- X: `@PeakSan958457`
