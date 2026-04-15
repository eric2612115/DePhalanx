import { describe, expect, it } from "vitest";

import { runP0AllocationMainline } from "../src/flows/p0-allocation-mainline.js";

describe("P0 allocation mainline", () => {
  it("runs the approval-aware Telegram mainline through Phalanx-Skill", async () => {
    const result = await runP0AllocationMainline({
      message: "funds are ready",
      mandate: {
        userId: "user-1",
        riskMode: "balanced",
        protocolPreferences: { aave: "prefer", morpho: "allow", uniswap: "approval_required" },
        chainPreferences: { base: "prefer", xlayer: "allow" },
        allocationCaps: { aave: 0.5, morpho: 0.4, uniswap: 0.2 },
        approvalRequirements: { uniswap: true },
        automationLevel: "supervised",
        lastUpdatedSource: "operator_message",
      },
      opportunities: [
        { protocol_name: "Aave", chain_name: "Base", asset_symbol: "USDC", apy: "0.08", risk_rank: 1 },
        { protocol_name: "Morpho", chain_name: "Base", asset_symbol: "USDC", apy: "0.11", risk_rank: 2 },
        { protocol_name: "Uniswap", chain_name: "Base", asset_symbol: "USDC", apy: "0.13", risk_rank: 3 },
        { protocol_name: "Aave", chain_name: "XLayer", asset_symbol: "USDT", apy: "0.07", risk_rank: 1 },
      ],
    });

    expect(result.timeline).toEqual([
      "intent_received",
      "omrate_requested",
      "allocation_compiled",
      "pending_approval_rendered",
      "approval_resumed",
      "result_report_rendered",
    ]);
    expect(result.approvalPrompt).toMatch(/Uniswap/i);
    expect(result.finalSummary).toMatch(/exec-approved/i);
    expect(result.proof.timeline).toEqual(result.timeline);
  });
});
