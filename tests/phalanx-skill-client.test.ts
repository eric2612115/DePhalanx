import { describe, expect, it } from "vitest";

import { OpenClawAdapter } from "../src/brain/openclaw-adapter.js";
import { PhalanxSkillClient } from "../src/bridge/phalanx-skill-client.js";

describe("DePhalanx bridge boundary", () => {
  it("normalizes incoming host payloads into a stable intent envelope", async () => {
    const adapter = new OpenClawAdapter();
    const intent = await adapter.normalizeIncoming({
      event: "message.received",
      data: {
        channel: "telegram",
        user: "user-1",
        chatId: "tg-1",
        message: "funds are ready",
        sessionId: "session-1",
      },
    });

    expect(intent).toMatchObject({
      kind: "operator_message",
      operatorId: "user-1",
      channel: "telegram",
      replyTarget: "tg-1",
      sessionId: "session-1",
      message: "funds are ready",
    });
  });

  it("parses approve commands into approval-response intents", async () => {
    const adapter = new OpenClawAdapter();
    const intent = await adapter.normalizeIncoming({
      event: "message.received",
      data: {
        channel: "telegram",
        user: "user-1",
        chatId: "tg-1",
        message: "approve approval-1",
      },
    });

    expect(intent).toMatchObject({
      kind: "approval_response",
      operatorId: "user-1",
      approvalId: "approval-1",
      resumeToken: "approval-1",
      approved: true,
    });
  });

  it("executes only bounded action bundles and preserves pending approval state", async () => {
    const client = new PhalanxSkillClient({
      executeBundle: async (bundle) => {
        if (bundle.resume?.approvalId === "approval-1") {
          return { status: "completed", executionId: "exec-2", results: [{ ok: true }] } as const;
        }
        return {
          status: "pending_approval",
          approvalId: "approval-1",
          resumeToken: "resume-1",
          message: "Uniswap requires approval",
        } as const;
      },
    });

    const first = await client.execute({
      actions: [
        {
          action: "deposit",
          target: "pool",
          payload: { chain: "base", token: "USDC", amount: "8", investmentId: "demo-aave", platformId: "aave-v3" },
          summary: "Deposit base USDC into Aave.",
        },
      ],
    });

    expect(first).toMatchObject({
      status: "pending_approval",
      approvalId: "approval-1",
      resumeToken: "resume-1",
    });
    expect(client.canAutoResume(first)).toBe(false);

    const resumed = await client.resumePendingApproval({
      approvalId: "approval-1",
      resumeToken: "resume-1",
      approved: true,
    });

    expect(resumed).toMatchObject({ status: "completed", executionId: "exec-2" });
  });
});
