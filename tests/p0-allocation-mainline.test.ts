import { describe, expect, it } from "vitest";

import { runApprovalLiveP0Turn, runInitialLiveP0Turn } from "../src/flows/p0-allocation-mainline.js";
import { PhalanxSkillClient } from "../src/bridge/phalanx-skill-client.js";

const mandate = {
  userId: "user-1",
  riskMode: "balanced",
  protocolPreferences: { aave: "prefer", morpho: "allow", uniswap: "approval_required" },
  chainPreferences: { base: "prefer", xlayer: "allow" },
  allocationCaps: { aave: 0.5, morpho: 0.4, uniswap: 0.2 },
  approvalRequirements: { uniswap: true },
  automationLevel: "supervised",
  lastUpdatedSource: "operator_message",
} as const;

const opportunities = [
  { protocol_name: "Aave", chain_name: "Base", asset_symbol: "USDC", apy: "0.08", risk_rank: 1 },
  { protocol_name: "Morpho", chain_name: "Base", asset_symbol: "USDC", apy: "0.11", risk_rank: 2 },
  { protocol_name: "Uniswap", chain_name: "Base", asset_symbol: "USDC", apy: "0.13", risk_rank: 3 },
  { protocol_name: "Aave", chain_name: "XLayer", asset_symbol: "USDT", apy: "0.07", risk_rank: 1 },
] as const;

describe("live allocation flow", () => {
  it("surfaces pending approval from the live orchestration turn and resumes it explicitly", async () => {
    const client = new PhalanxSkillClient({
      executeBundle: async (bundle) =>
        bundle.resume
          ? { status: "completed", executionId: "exec-approved", results: [] }
          : {
              status: "pending_approval",
              approvalId: "approval-uniswap",
              resumeToken: "approval-uniswap",
              message: "Approval requested via Telegram; whitelist update must complete before execution resumes.",
            },
    });

    const first = await runInitialLiveP0Turn({
      intent: {
        kind: "operator_message",
        operatorId: "user-1",
        channel: "telegram",
        replyTarget: "tg-1",
        message: "funds are ready",
      },
      mandate,
      client,
      opportunities,
    });

    expect(first.timeline).toEqual([
      "intent_received",
      "omrate_requested",
      "allocation_compiled",
      "pending_approval_rendered",
    ]);
    expect(first.outboundMessage).toMatch(/Approval ID: approval-uniswap/);

    const second = await runApprovalLiveP0Turn({
      intent: {
        kind: "approval_response",
        operatorId: "user-1",
        channel: "telegram",
        replyTarget: "tg-1",
        approvalId: "approval-uniswap",
        resumeToken: "approval-uniswap",
        approved: true,
        message: "approve approval-uniswap",
      },
      client,
    });

    expect(second.timeline).toEqual(["intent_received", "approval_resumed", "result_report_rendered"]);
    expect(second.outboundMessage).toMatch(/Execution completed: exec-approved/);
  });
});
