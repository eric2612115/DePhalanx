# DePhalanx

`DePhalanx` is the mandate-aware product layer of AgentPhalanx. It connects an external brain host such as OpenClaw to `Phalanx-Skill`, owns `PhalanxLayer`, shapes portfolio decisions, renders approval/result messages, and drives the replayable P0 flow for the demo.

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
- replayable P0 orchestration

`DePhalanx` does not own:

- raw signing
- unrestricted contract execution
- direct `Onchain OS` bypasses

## Deployment Address

Current P0 demo deployment model:

- `DePhalanx`: local Node.js runtime
- `Phalanx-Skill` bridge target: local runtime or service URL via `DEPHALANX_PHALANX_SKILL_BASE_URL`
- OmRate intelligence endpoint: [https://api.omrate.com](https://api.omrate.com)

The repo includes a replayable local demo entry:

```bash
npm install
npm run demo:p0
```

## Onchain OS Skill / Uniswap Skill Usage

- `DePhalanx` does not call `Onchain OS` directly.
- `DePhalanx` uses `Phalanx-Skill` as the only bounded execution bridge.
- `Phalanx-Skill` is responsible for execution-side integration with `Onchain OS`, policy checks, whitelist checks, approvals, and evidence capture.
- The representative P0 path includes a `Uniswap` leg that intentionally degrades into `pending_approval`, so the approval UX is owned by `DePhalanx` while execution authority remains in `Phalanx-Skill`.

## Operating Mechanism

The current P0 mainline is:

1. The operator says funds are ready.
2. `DePhalanx` normalizes the incoming intent through `BrainAdapter`.
3. `DePhalanx` requests OmRate-style opportunity data and normalizes it.
4. `PhalanxLayer` filters opportunities against mandate and risk preference.
5. `DePhalanx` compiles a bounded action bundle for `Phalanx-Skill`.
6. `Phalanx-Skill` returns `pending_approval` for the approval-gated `Uniswap` leg.
7. `DePhalanx` renders the approval prompt and resumes only after explicit approval.
8. `DePhalanx` renders the final result summary and replay proof artifact.

## X Layer Positioning

`DePhalanx` positions AgentPhalanx as an operator layer for cross-chain DeFi automation in the X Layer ecosystem. In the current P0 story it treats `Base` as the larger stable allocation venue and keeps an `X Layer` leg in the proposal so the product can demonstrate cross-chain mandate-aware allocation instead of a single-chain script.

## Team

- Eric
- X: `@PeakSan958457`
