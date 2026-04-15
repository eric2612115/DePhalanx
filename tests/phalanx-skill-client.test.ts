import { describe, expect, it } from "vitest";

import { OpenClawAdapter } from "../src/brain/openclaw-adapter.js";
import { PhalanxSkillClient } from "../src/bridge/phalanx-skill-client.js";

describe("DePhalanx bridge boundary", () => {
  it("normalizes incoming host payloads into a stable intent envelope", async () => {
    const adapter = new OpenClawAdapter();
    const intent = await adapter.normalizeIncoming({
      chat_id: "tg-1",
      user_id: "user-1",
      text: "funds are ready",
      channel: "telegram",
    });

    expect(intent).toMatchObject({
      kind: "operator_message",
      operatorId: "user-1",
      channel: "telegram",
      message: "funds are ready",
    });
  });

  it("executes only bounded action bundles and preserves pending approval state", async () => {
    const client = new PhalanxSkillClient({
      executeBundle: async (bundle) => {
        if (bundle.resume?.approvalId === "approval-1") {
          return { status: "completed", executionId: "exec-2" } as const;
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
      actions: [{ type: "deposit_aave", chain: "base", asset: "USDC", amount: "8" }],
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
