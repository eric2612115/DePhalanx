import { afterEach, describe, expect, it, vi } from "vitest";

import { createDePhalanxApp } from "../src/index.js";
import { PhalanxSkillClient } from "../src/bridge/phalanx-skill-client.js";

const testConfig = {
  brainHost: "openclaw",
  openClawBaseUrl: "http://127.0.0.1:18789",
  openClawHookToken: undefined,
  openClawWebhookSecret: undefined,
  listenHost: "127.0.0.1",
  port: 4319,
  phalanxSkillCommand: "npx",
  phalanxSkillArgs: ["tsx", "src/app/skill-runtime-bootstrap.ts"],
  phalanxSkillCwd: "/tmp/phalanx-skill",
  phalanxSkillConfigPath: undefined,
  mandateStorePath: "./mandates",
  omRateBaseUrl: "https://api.omrate.com",
  omRatePath: "/markets?limit=200",
  omRateMode: "x402_optional" as const,
};

describe("DePhalanx bootstrap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("boots the DePhalanx product shell", async () => {
    const app = await createDePhalanxApp(testConfig, {
      phalanxSkillClient: new PhalanxSkillClient({
        executeBundle: async () => ({ status: "completed", executionId: "exec-1", results: [] }),
      }),
    });
    expect(app.brainAdapter).toBeDefined();
    expect(app.phalanxSkillClient).toBeDefined();
    await app.close();
  });

  it("fails live handling when OpenClaw hook delivery is not configured", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { protocol: "aave_v3", chain_name: "Base", debt_token: { symbol: "USDC" }, net_supply_apy: 0.08 },
            { protocol: "morpho", chain_name: "Base", debt_token: { symbol: "USDC" }, net_supply_apy: 0.11 },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            {
              protocol: "uniswap_v3",
              chain_name: "Base",
              token0: { symbol: "USDC" },
              token1: { symbol: "WETH" },
              apr_estimate: 0.13,
            },
          ],
        }),
      } as Response);

    const app = await createDePhalanxApp(testConfig, {
      phalanxSkillClient: new PhalanxSkillClient({
        executeBundle: async (bundle) =>
          bundle.resume
            ? { status: "completed", executionId: "exec-2", results: [] }
            : {
                status: "pending_approval",
                approvalId: "approval-1",
                resumeToken: "approval-1",
                message: "approval required",
              },
      }),
    });

    await expect(
      app.handleOpenClawPayload({
        event: "message.received",
        data: {
          channel: "telegram",
          user: "demo-operator",
          chatId: "tg-1",
          message: "funds are ready",
        },
      }),
    ).rejects.toThrow(/OpenClaw hook token is required/i);
    await app.close();
  });
});
