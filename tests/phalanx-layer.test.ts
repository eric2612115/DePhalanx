import { describe, expect, it } from "vitest";

import { compileAllocationPlan } from "../src/phalanx-layer/action-compiler.js";
import { buildRiskPreferenceModel } from "../src/phalanx-layer/risk-preference-model.js";
import { filterOpportunities } from "../src/phalanx-layer/opportunity-filter.js";

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
  { protocol: "aave", chain: "base", asset: "USDC", maxApy: 0.08, riskRank: 1 },
  { protocol: "morpho", chain: "base", asset: "USDC", maxApy: 0.11, riskRank: 2 },
  { protocol: "uniswap", chain: "base", asset: "USDC", pairedAsset: "WETH", maxApy: 0.13, riskRank: 3 },
  { protocol: "aave", chain: "xlayer", asset: "USDT", maxApy: 0.07, riskRank: 1 },
];

describe("PhalanxLayer", () => {
  it("favors lower-risk protocols while preserving an approval-gated higher-risk leg", () => {
    const riskModel = buildRiskPreferenceModel(mandate);
    const filtered = filterOpportunities(opportunities, mandate, riskModel);
    const bundle = compileAllocationPlan({
      mandate,
      filtered,
      capitalByChain: { base: 20, xlayer: 2 },
    });

    expect(bundle.actions).toEqual([
      { type: "deposit_aave", chain: "base", asset: "USDC", amount: "8" },
      { type: "deposit_morpho", chain: "base", asset: "USDC", amount: "8" },
      expect.objectContaining({ type: "request_uniswap_allocation_approval", chain: "base" }),
      { type: "deposit_aave", chain: "xlayer", asset: "USDT", amount: "2" },
    ]);
  });
});
